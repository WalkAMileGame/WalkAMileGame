import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GamemasterProgress.css';
import Timer from './ui/Timer';
import { API_BASE } from '../api';

const GamemasterProgress = () => {
  const { gamecode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeAdjustment, setTimeAdjustment] = useState('');

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`${API_BASE}/rooms/${gamecode}`);
        if (!response.ok) {
          throw new Error('Failed to fetch room data');
        }
        const data = await response.json();
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

    // Poll every 2 seconds
    const interval = setInterval(fetchRoomData, 2000);

    return () => clearInterval(interval);
  }, [gamecode]);

  const handlePauseResume = async () => {
    try {
      const endpoint = roomData.game_paused ? 'resume' : 'pause';
      const response = await fetch(`${API_BASE}/rooms/${gamecode}/${endpoint}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} game`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEndGame = async () => {
    if (!window.confirm('Are you sure you want to end the game? This cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/rooms/${gamecode}/end`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to end game');
      }
      alert('Game ended successfully');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddTime = async () => {
    const minutes = parseInt(timeAdjustment);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid number of minutes to add');
      return;
    }
    try {
      const newTimeRemaining = roomData.time_remaining + minutes;
      const response = await fetch(`${API_BASE}/rooms/${gamecode}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_remaining: newTimeRemaining }),
      });
      if (!response.ok) {
        throw new Error('Failed to add time');
      }
      setTimeAdjustment('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleRemoveTime = async () => {
    const minutes = parseInt(timeAdjustment);
    if (isNaN(minutes) || minutes <= 0) {
      alert('Please enter a valid number of minutes to remove');
      return;
    }
    try {
      const newTimeRemaining = Math.max(0, roomData.time_remaining - minutes);
      const response = await fetch(`${API_BASE}/rooms/${gamecode}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_remaining: newTimeRemaining }),
      });
      if (!response.ok) {
        throw new Error('Failed to remove time');
      }
      setTimeAdjustment('');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="gamemaster-progress">
        <div className="loading">Loading game data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gamemaster-progress">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="gamemaster-progress">
      <div className="progress-header">
        <h1>Gamemaster Dashboard</h1>
        <div className="game-info">
          <span className="game-code">Game Code: {gamecode}</span>
          <span className={`timer ${roomData?.game_paused ? 'paused' : ''}`}>
            Time Remaining: <Timer gamecode={gamecode} />
            {roomData?.game_paused && ' (PAUSED)'}
          </span>
        </div>
      </div>

      <div className="controls-container">
        <h2>Game Controls</h2>

        <div className="control-group">
          <h3>Timer Control</h3>
          <button
            className={`btn ${roomData?.game_paused ? 'btn-resume' : 'btn-pause'}`}
            onClick={handlePauseResume}
          >
            {roomData?.game_paused ? 'Resume Game' : 'Pause Game'}
          </button>
        </div>

        <div className="control-group">
          <h3>Adjust Time</h3>
          <div className="time-adjustment">
            <input
              type="number"
              className="time-input"
              placeholder="Minutes"
              value={timeAdjustment}
              onChange={(e) => setTimeAdjustment(e.target.value)}
              min="1"
            />
            <button className="btn btn-add-time" onClick={handleAddTime}>
              Add Time
            </button>
            <button className="btn btn-remove-time" onClick={handleRemoveTime}>
              Remove Time
            </button>
          </div>
        </div>

        <div className="control-group">
          <h3>End Game</h3>
          <button className="btn btn-end-game" onClick={handleEndGame}>
            End Game Now
          </button>
        </div>
      </div>

      <div className="teams-container">
        <h2>Teams in Game ({roomData?.teams?.length || 0})</h2>
        {roomData?.teams && roomData.teams.length > 0 ? (
          <div className="teams-list">
            {roomData.teams.map((team, index) => (
              <div key={index} className="team-item">
                <div className="team-name">{team.team_name}</div>
                <div className="team-circumstance">{team.circumstance}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-teams">No teams have joined yet</div>
        )}
      </div>
    </div>
  );
};

export default GamemasterProgress;
