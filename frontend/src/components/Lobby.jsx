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
  
  const inviteCode = (location.state?.inviteCode || gamecode || '').trim();
  const isGamemaster = location.state?.isGamemaster || false;
  const boardConfig = location.state?.boardConfig;

  // Create room when gamemaster arrives
  useEffect(() => {
    if (isGamemaster && boardConfig) {
      console.log('Sending room data:', JSON.stringify(roomData, null, 2));
      createRoom();
    } else if (!isGamemaster) {
      // Players don't create rooms, mark as ready to poll
      setRoomCreated(true);
    }
  }, []);

  // RESOLVED: Keep HEAD version - Poll room data after room is created or for players
  // This is better because it waits for room creation before polling
  useEffect(() => {
    if (!roomCreated) return;
    
    const timer = setTimeout(() => {
      loadRoomData();
      const interval = setInterval(loadRoomData, 2000);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [roomCreated]);

  // Redirect players when game starts
  useEffect(() => {
    if (roomData?.game_started && !isGamemaster) {
      // Get team name from sessionStorage since state is cleared after join
      const savedTeamName = sessionStorage.getItem('teamName');
      if (savedTeamName) {
        navigate(`/game/${inviteCode}/${savedTeamName}`, {
          state: { boardConfig: roomData.board_config, teamName: savedTeamName }
        });
      }
    }
  }, [roomData?.game_started, isGamemaster]);

  const createRoom = async () => {
    console.log('=== CREATE ROOM DEBUG ===');
    console.log('inviteCode:', `"${inviteCode}"`); // Quotes will show spaces
    console.log('inviteCode length:', inviteCode.length);
    console.log('boardConfig:', boardConfig);
    console.log('boardConfig type:', typeof boardConfig);
    console.log('boardConfig keys:', boardConfig ? Object.keys(boardConfig) : 'null');
    
    if (!boardConfig) {
      console.error('Cannot create room: boardConfig is missing');
      alert('No board configuration found. Please create a board first.');
      return;
    }
    
    console.log('boardConfig.name:', boardConfig.name);
    console.log('boardConfig.ringData:', boardConfig.ringData);
    console.log('boardConfig.ringData type:', Array.isArray(boardConfig.ringData) ? 'array' : typeof boardConfig.ringData);
    console.log('boardConfig.ringData length:', boardConfig.ringData?.length);
    
    if (boardConfig.ringData && boardConfig.ringData.length > 0) {
      console.log('First ring structure:', JSON.stringify(boardConfig.ringData[0], null, 2));
      console.log('First ring keys:', Object.keys(boardConfig.ringData[0]));
    }
    
    // Validate the boardConfig has required fields
    if (!boardConfig.name || !boardConfig.ringData) {
      console.error('Invalid boardConfig structure:', boardConfig);
      console.error('boardConfig keys:', Object.keys(boardConfig));
      alert(`Invalid board configuration. Board must have 'name' and 'ringData' fields.`);
      return;
    }
    
    const roomPayload = {
      room_code: inviteCode.trim(), // Remove any whitespace
      gamemaster_name: 'Gamemaster',
      board_config: boardConfig,
      time_remaining: timeRemaining,
      teams: [],
      game_started: false
    };
    
    console.log('=== FINAL PAYLOAD ===');
    console.log(JSON.stringify(roomPayload, null, 2));
    
    try {
      const response = await fetch(`${API_BASE}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomPayload)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== ERROR RESPONSE ===');
        console.error('Status:', response.status);
        console.error('Error text:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Parsed error:', JSON.stringify(errorData, null, 2));
        } catch (e) {
          console.error('Could not parse error as JSON');
        }
        alert('Failed to create room. Check console for details.');
      } else {
        const responseData = await response.json();
        console.log('=== SUCCESS ===');
        console.log('Room created:', responseData);
        setRoomCreated(true);
      }
    } catch (err) {
      console.error('=== EXCEPTION ===');
      console.error('Error creating room:', err);
      alert('Error creating room. Please try again.');
    }
  };

  const loadRoomData = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}`);
      if (response.ok) {
        const data = await response.json();
        setRoomData(data);
        // Only update time if user is not currently editing it
        if (!isEditingTimeRef.current) {
          setTimeRemaining(data.time_remaining);
          setTimeInput(String(data.time_remaining));
        }
      } else if (response.status === 404) {
        // Room doesn't exist yet - this is normal for players arriving before gamemaster
        console.log('Room not found yet, will retry...');
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  const updateTime = async () => {
    const newTime = parseInt(timeInput) || 0;
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_remaining: newTime })
      });
      setTimeRemaining(newTime);
      setIsEditingTime(false);
      isEditingTimeRef.current = false;
      loadRoomData();
    } catch (err) {
      console.error('Error updating time:', err);
    }
  };

  const deleteTeam = async (teamName) => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/teams/${teamName}`, {
        method: 'DELETE'
      });
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
        body: JSON.stringify({ circumstance })
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

  const startGame = async () => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/start`, { method: 'POST' });
      navigate(`/game/${inviteCode}/${teamName || 'Gamemaster'}`, {
        state: { boardConfig: boardConfig, isGamemaster: true, timeRemaining: timeRemaining, teamName: teamName || 'Gamemaster'}
      });
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  // RESOLVED: Combined both versions - error handling from HEAD + sessionStorage from merge branch
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
          id: Date.now(), // Generate unique ID
          team_name: teamName,
          circumstance: '',
          current_energy: 32,
          gameboard_state: roomData?.board_config?.ringData?.[0] || {} // Use first ring as default
        })
      });
      
      // Keep error handling from HEAD
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create team:', errorText);
        alert('Failed to create team. Please try again.');
        return;
      }
      
      // Add sessionStorage from merge branch
      sessionStorage.setItem('teamName', teamName);
      
      setHasJoined(true);
      setTeamName('');
      await loadRoomData(); // Use await from merge branch
    } catch (err) {
      console.error('Error creating team:', err);
      alert('Error creating team. Please try again.');
    }
  };

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
              onChange={(e) => setTimeInput(e.target.value)}
              onFocus={() => {
                setIsEditingTime(true);
                isEditingTimeRef.current = true;
              }}
              onBlur={() => {
                // If empty, set to '0'
                if (timeInput === '') {
                  setTimeInput('0');
                }
                setIsEditingTime(false);
                isEditingTimeRef.current = false;
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  updateTime();
                }
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
                {roomData.teams.map((team, index) => (
                  <li key={index} className="team-item">
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
                              onClick={() => updateTeamCircumstance(team.team_name, editCircumstance)}
                              className="btn btn-primary"
                            >
                              Save
                            </button>
                            <button 
                              onClick={cancelEditingCircumstance}
                              className="btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="team-circumstance">
                          {team.circumstance || <em style={{ color: '#999' }}>No circumstance set</em>}
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

          <button 
            onClick={startGame}
            className="btn btn-start"
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Player view
  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-header">
          <h1 className="lobby-title">Lobby: {inviteCode}</h1>
        </div>
        
        {!roomData ? (
          <div className="waiting-message pulse">
            <p>Waiting for gamemaster to create the room...</p>
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
            
            <button onClick={handleTeamSubmit} className="btn btn-primary" style={{ width: '100%' }}>
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
                {roomData.teams.map((team, index) => (
                  <li key={index} className="team-item">
                    <div className="team-info">
                      <div className="team-name">{team.team_name}</div>
                      <div className="team-circumstance">{team.circumstance || <em style={{ color: '#999' }}>No circumstance set</em>}</div>
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
