import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import '../styles/Lobby.css';

export default function Lobby() {
  const { gamecode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [teamName, setTeamName] = useState('');
  const [circumstance, setCircumstance] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [hasJoined, setHasJoined] = useState(false);
  
  const inviteCode = location.state?.inviteCode || gamecode;
  const isGamemaster = location.state?.isGamemaster || false;
  const boardConfig = location.state?.boardConfig;

  // Create room when gamemaster arrives
  useEffect(() => {
    if (isGamemaster && boardConfig) {
      createRoom();
    }
  }, []);

  // Poll room data for everyone
  useEffect(() => {
    const timer = setTimeout(() => {
      loadRoomData();
      const interval = setInterval(loadRoomData, 2000);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Redirect players when game starts
  useEffect(() => {
    if (roomData?.game_started && !isGamemaster) {
      navigate(`/game/${inviteCode}`, {
        state: { boardConfig: roomData.board_config }
      });
    }
  }, [roomData?.game_started, isGamemaster]);

  const createRoom = async () => {
    console.log('Creating room with:', { inviteCode, boardConfig, isGamemaster });
    
    if (!boardConfig) {
      console.error('Cannot create room: boardConfig is missing');
      return;
    }
    
    const roomData = {
      room_code: inviteCode,
      gamemaster_name: 'Gamemaster',
      board_config: boardConfig,
      time_remaining: 60,
      teams: [],
      game_started: false
    };
    
    console.log('Sending room data:', JSON.stringify(roomData, null, 2));
    
    try {
      const response = await fetch(`${API_BASE}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create room:', errorData);
      } else {
        console.log('Room created successfully');
      }
    } catch (err) {
      console.error('Error creating room:', err);
    }
  };

  const loadRoomData = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}`);
      if (response.ok) {
        const data = await response.json();
        setRoomData(data);
        setTimeRemaining(data.time_remaining);
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  const updateTime = async () => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_remaining: timeRemaining })
      });
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

  const startGame = async () => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/start`, { method: 'POST' });
      navigate(`/game/${inviteCode}`, {
        state: { boardConfig: boardConfig, isGamemaster: true }
      });
    } catch (err) {
      console.error('Error starting game:', err);
    }
  };

  const handleTeamSubmit = async () => {
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: teamName,
          circumstance: circumstance,
          board_status: {}
        })
      });
      setHasJoined(true);
      loadRoomData();
    } catch (err) {
      console.error('Error creating team:', err);
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
              value={timeRemaining}
              onChange={(e) => setTimeRemaining(parseInt(e.target.value) || 0)}
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
                      <div className="team-circumstance">{team.circumstance}</div>
                    </div>
                    <button 
                      onClick={() => deleteTeam(team.team_name)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
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
        
        {!hasJoined ? (
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
            
            <div className="form-group">
              <label className="form-label">Circumstance</label>
              <input
                type="text"
                value={circumstance}
                onChange={(e) => setCircumstance(e.target.value)}
                placeholder="Enter circumstance"
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
                    <div className="team-circumstance">{team.circumstance}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-teams">No teams yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
