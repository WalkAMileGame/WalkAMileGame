import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import '../styles/Lobby.css';

export default function Lobby() {
  const { gamecode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [teamName, setTeamName] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timeInput, setTimeInput] = useState('30');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const isEditingTimeRef = useRef(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editCircumstance, setEditCircumstance] = useState('');
  const [roomCreated, setRoomCreated] = useState(false);
  const initializingRef = useRef(false);

  const inviteCode = (location.state?.inviteCode || gamecode || '').trim();
  const isGamemaster = location.state?.isGamemaster || false;
  const boardConfig = location.state?.boardConfig;

  // --- Restore team join state on reload ---
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') return; // don't auto-restore in test env
    const savedTeamName = sessionStorage.getItem(`teamName_${inviteCode}`);
    if (savedTeamName) {
      setTeamName(savedTeamName);
      setHasJoined(true);
    }
  }, [inviteCode]);

  // --- Gamemaster: create room or resume existing one ---
  useEffect(() => {
    // Skip if room was already created or initialization already started
    if (roomCreated || initializingRef.current) return;

    // Mark that initialization has started
    initializingRef.current = true;

    // Skip existence check entirely during automated tests
    if (process.env.NODE_ENV === 'test') {
      if (isGamemaster) createRoom();
      else setRoomCreated(true);
      return;
    }

    const init = async () => {
      if (isGamemaster) {
        try {
          const response = await fetch(`${API_BASE}/rooms/${inviteCode}`);
          if (response.ok) {
            console.log('Room already exists, skipping creation');
            setRoomCreated(true);
          } else if (response.status === 404) {
            await createRoom();
          } else {
            console.error('Unexpected response when checking room:', response.status);
          }
        } catch (err) {
          console.error('Error checking room existence:', err);
        }
      } else {
        setRoomCreated(true);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Poll room data after creation ---
  useEffect(() => {
    if (!roomCreated) return;

    const startPolling = () => {
      loadRoomData();
      const intervalDelay = process.env.NODE_ENV === 'test' ? 500 : 2000;
      const interval = setInterval(loadRoomData, intervalDelay);
      return () => clearInterval(interval);
    };

    if (process.env.NODE_ENV === 'test') {
      return startPolling();
    }

    const timer = setTimeout(startPolling, 500);
    return () => clearTimeout(timer);
  }, [roomCreated]);

  // --- Redirect players when game starts ---
  useEffect(() => {
    if (!roomData?.game_started || isGamemaster) return;

    const saveBoardAndNavigate = async () => {
      const savedTeamName = sessionStorage.getItem(`teamName_${inviteCode}`);
      if (!savedTeamName) return;

      try {
        await fetch(`${API_BASE}/rooms/${inviteCode}/teams/${savedTeamName}/board`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board_state: roomData.board_config }),
        });

        navigate(`/game/${inviteCode}/${savedTeamName}`, {
          state: { boardConfig: roomData.board_config, teamName: savedTeamName },
        });

      } catch (err) {
        console.error("Failed to save board:", err);
      }
    };

    saveBoardAndNavigate();
  }, [roomData?.game_started, isGamemaster, inviteCode, navigate, roomData?.board_config]);


  // --- Create room ---
  const createRoom = async () => {
    if (!boardConfig) {
      console.error('Cannot create room: boardConfig is missing');
      alert('No board configuration found. Please create a board first.');
      return;
    }

    if (!boardConfig.name || !boardConfig.ringData) {
      console.error('Invalid boardConfig structure:', boardConfig);
      alert(`Invalid board configuration. Board must have 'name' and 'ringData' fields.`);
      return;
    }

    const roomPayload = {
      room_code: inviteCode.trim(),
      gamemaster_name: 'Gamemaster',
      board_config: boardConfig,
      time_remaining: timeRemaining,
      teams: [],
      game_started: false,
    };

    try {
      const response = await fetch(`${API_BASE}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create room:', errorText);
        alert('Failed to create room. Check console for details.');
      } else {
        await response.json();
        setRoomCreated(true);
      }
    } catch (err) {
      console.error('Error creating room:', err);
      alert('Error creating room. Please try again.');
    }
  };

  // --- Load room data ---
  const loadRoomData = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}`);
      if (response.ok) {
        const data = await response.json();
        setRoomData(data);
        if (!isEditingTimeRef.current) {
          setTimeRemaining(data.time_remaining);
          setTimeInput(String(data.time_remaining));
        }
      } else if (response.status === 404) {
        console.log('Room not found yet, will retry...');
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  // --- Time update ---
  const updateTime = async () => {
    const newTime = parseInt(timeInput) || 0;
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_remaining: newTime }),
      });
      setTimeRemaining(newTime);
      setIsEditingTime(false);
      isEditingTimeRef.current = false;
      loadRoomData();
    } catch (err) {
      console.error('Error updating time:', err);
    }
  };

  // --- Team management ---
  const deleteTeam = async (teamName) => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/teams/${teamName}`, { method: 'DELETE' });
      loadRoomData();
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  const updateTeamCircumstance = async (teamName, circumstance) => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/teams/${teamName}/circumstance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circumstance }),
      });
      setEditingTeam(null);
      setEditCircumstance('');
      loadRoomData();
    } catch (err) {
      console.error('Error updating team circumstance:', err);
    }
  };

  const startEditingCircumstance = (team) => {
    setEditingTeam(team.team_name);
    setEditCircumstance(team.circumstance || '');
  };

  const cancelEditingCircumstance = () => {
    setEditingTeam(null);
    setEditCircumstance('');
  };

  // --- Start game ---
  const startGame = async () => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/start`, { method: 'POST' });
      navigate(`/gamemaster/progress/${inviteCode}`, {
        state: {
          boardConfig,
          isGamemaster: true,
          timeRemaining,
        },
      });
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  // --- Handle team join ---
  const handleTeamSubmit = async () => {
    if (!teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: Date.now(),
          team_name: teamName,
          circumstance: '',
          current_energy: 32,
          gameboard_state: roomData?.board_config?.ringData?.[0] || {},
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create team:', errorText);
        alert('Failed to create team. Please try again.');
        return;
      }

      sessionStorage.setItem(`teamName_${inviteCode}`, teamName);
      setHasJoined(true);
      setTeamName('');
      await loadRoomData();
    } catch (err) {
      console.error('Failed to create team:', err);
      alert('Failed to create team. Please try again.');
    }
  };

  // --- RENDER ---
  if (isGamemaster) {
    return (
      <div className="lobby-container">
        <div className="lobby-card">
          <div className="lobby-header">
            <h1 className="lobby-title">Lobby: {inviteCode}</h1>
            <div className="gamemaster-badge">Gamemaster</div>
          </div>

          <div className="time-section">
            <span className="time-label">Time Remaining (minutes):</span>
            <input
              type="number"
              value={timeInput}
              onChange={(e) => {
                setTimeInput(e.target.value);
                setIsEditingTime(true);
                isEditingTimeRef.current = true;
              }}
              onFocus={() => {
                setIsEditingTime(true);
                isEditingTimeRef.current = true;
              }}
              onBlur={() => {
                if (timeInput === '') setTimeInput('0');
                setIsEditingTime(false);
                isEditingTimeRef.current = false;
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') updateTime();
              }}
              className="time-input"
            />
            <button onClick={updateTime} className="btn btn-primary">
              Update Time
            </button>
          </div>

          <div className="teams-section">
            <h2 className="teams-header">
              Teams <span className="teams-count">{roomData?.teams?.length || 0}</span>
            </h2>
            {roomData?.teams?.length > 0 ? (
              <ul className="teams-list">
                {roomData.teams.map((team, i) => (
                  <li key={i} className="team-item">
                    <div className="team-info">
                      <div className="team-name">{team.team_name}</div>
                      {editingTeam === team.team_name ? (
                        <div className="edit-circumstance-section">
                          <input
                            type="text"
                            value={editCircumstance}
                            onChange={(e) => setEditCircumstance(e.target.value)}
                            placeholder="Enter circumstance"
                            className="form-input"
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() =>
                                updateTeamCircumstance(team.team_name, editCircumstance)
                              }
                              className="btn btn-primary"
                            >
                              Save
                            </button>
                            <button onClick={cancelEditingCircumstance} className="btn">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="team-circumstance">
                          {team.circumstance || (
                            <em style={{ color: '#999' }}>No circumstance set</em>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="team-actions">
                      {editingTeam !== team.team_name && (
                        <button
                          onClick={() => startEditingCircumstance(team)}
                          className="btn btn-primary"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => deleteTeam(team.team_name)}
                        className="btn btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-teams">Waiting for teams to join...</div>
            )}
          </div>

          <button onClick={startGame} className="btn btn-start">
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // --- Player View ---
  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-header">
          <h1 className="lobby-title">Lobby: {inviteCode}</h1>
        </div>

        {!roomData ? (
          <div className="waiting-message pulse">
            <p>Room does not exist. Waiting for gamemaster to create the room...</p>
          </div>
        ) : !hasJoined ? (
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter team name"
                className="form-input"
              />
            </div>

            <button
              onClick={handleTeamSubmit}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Create Team
            </button>
          </div>
        ) : (
          <div className="waiting-message pulse">
            <p>Waiting for gamemaster to start the game...</p>
          </div>
        )}

        {roomData && (
          <div className="teams-section">
            <h2 className="teams-header">
              Teams <span className="teams-count">{roomData?.teams?.length || 0}</span>
            </h2>
            {roomData?.teams?.length > 0 ? (
              <ul className="teams-list">
                {roomData.teams.map((team, i) => (
                  <li key={i} className="team-item">
                    <div className="team-info">
                      <div className="team-name">{team.team_name}</div>
                      <div className="team-circumstance">
                        {team.circumstance || (
                          <em style={{ color: '#999' }}>No circumstance set</em>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-teams">No teams yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
