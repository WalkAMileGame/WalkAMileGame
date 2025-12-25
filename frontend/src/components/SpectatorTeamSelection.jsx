import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/SpectatorTeamSelection.css';

const SpectatorTeamSelection = () => {
  const { gamecode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await authFetch(`/rooms/${gamecode}`);
        if (!response.ok) {
          throw new Error('Room not found');
        }
        const data = await response.json();

        // If comparison mode is active, redirect to comparison page
        if (data.comparison_mode) {
          navigate(`/comparison/${gamecode}`, {
            state: { isSpectator: true }
          });
          return;
        }

        // If game hasn't started, redirect to waiting room
        if (!data.game_started) {
          navigate(`/waiting/${gamecode}`);
          return;
        }

        setRoomData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchRoomData();

    // Poll every 2 seconds to check for comparison mode
    const interval = setInterval(fetchRoomData, 2000);
    return () => clearInterval(interval);
  }, [gamecode, navigate, authFetch]);

  const handleSelectTeam = (teamName) => {
    navigate(`/game/${gamecode}/${teamName}`, {
      state: {
        boardConfig: roomData.board_config,
        teamName: teamName,
        isSpectator: true
      }
    });
  };

  if (loading) {
    return (
      <div className="spectator-selection">
        <div className="loading">Loading game data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="spectator-selection">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-back" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spectator-selection">
      <div className="selection-card">
        <h1>Spectate Game</h1>
        <p className="game-code">Game Code: {gamecode}</p>
        <p className="instructions">Select a team to spectate:</p>

        <div className="teams-grid">
          {roomData?.teams && roomData.teams.length > 0 ? (
            roomData.teams.map((team, index) => (
              <div key={index} className="team-card" onClick={() => handleSelectTeam(team.team_name)}>
                <div className="team-name">{team.team_name}</div>
                <div className="team-circumstance">{team.circumstance || 'No circumstance set'}</div>
                <button className="btn-spectate">Spectate</button>
              </div>
            ))
          ) : (
            <div className="no-teams">No teams available to spectate</div>
          )}
        </div>

        <button className="btn-back-home" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default SpectatorTeamSelection;
