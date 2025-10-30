import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

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
      <div style={{ padding: '20px' }}>
        <h1>Lobby: {inviteCode}</h1>
        <p><strong>You are the Gamemaster</strong></p>
        
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <label>Time Remaining (minutes): </label>
          <input
            type="number"
            value={timeRemaining}
            onChange={(e) => setTimeRemaining(parseInt(e.target.value) || 0)}
            style={{ marginLeft: '10px', marginRight: '10px' }}
          />
          <button onClick={updateTime}>Update Time</button>
        </div>

        <h2>Teams ({roomData?.teams?.length || 0})</h2>
        {roomData?.teams?.length > 0 ? (
          <ul>
            {roomData.teams.map((team, index) => (
              <li key={index} style={{ marginBottom: '10px' }}>
                <strong>{team.team_name}</strong> - {team.circumstance}
                <button 
                  onClick={() => deleteTeam(team.team_name)}
                  style={{ marginLeft: '10px' }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No teams yet</p>
        )}

        <button 
          onClick={startGame}
          style={{ marginTop: '20px', padding: '10px 20px' }}
        >
          Start Game
        </button>
      </div>
    );
  }

  // Player view
  return (
    <div style={{ padding: '20px' }}>
      <h1>Lobby: {inviteCode}</h1>
      
      {!hasJoined ? (
        <div style={{ marginTop: '20px' }}>
          <label>Team Name:</label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter team name"
            style={{ display: 'block', marginTop: '5px', marginBottom: '15px' }}
          />
          
          <label>Circumstance:</label>
          <input
            type="text"
            value={circumstance}
            onChange={(e) => setCircumstance(e.target.value)}
            placeholder="Enter circumstance"
            style={{ display: 'block', marginTop: '5px', marginBottom: '15px' }}
          />
          
          <button onClick={handleTeamSubmit}>Create Team</button>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Waiting for gamemaster to start the game...</strong></p>
        </div>
      )}

      <h2 style={{ marginTop: '30px' }}>Teams ({roomData?.teams?.length || 0})</h2>
      {roomData?.teams?.length > 0 ? (
        <ul>
          {roomData.teams.map((team, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <strong>{team.team_name}</strong> - {team.circumstance}
            </li>
          ))}
        </ul>
      ) : (
        <p>No teams yet</p>
      )}
    </div>
  );
}
