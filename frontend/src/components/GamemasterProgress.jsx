import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GamemasterProgress.css';
import Timer from './ui/Timer';
import { useAuth } from '../context/AuthContext';

const GamemasterProgress = () => {
  const { gamecode } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeAdjustment, setTimeAdjustment] = useState('');

  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await authFetch(`/rooms/${gamecode}`);
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
      const response = await authFetch(`/rooms/${gamecode}/${endpoint}`, {
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
      const response = await authFetch(`/rooms/${gamecode}/end`, {
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

  const handleAdjustTime = async () => {
    const minutes = parseInt(timeAdjustment);
    if (isNaN(minutes)) {
      alert('Please enter a valid number of minutes (can be negative)');
      return;
    }
    if (minutes === 0) {
      setTimeAdjustment('');
      return;
    }
    try {
      let newTimeRemaining;

      // If game hasn't started yet, just add to the original time_remaining
      if (!roomData.game_started_at) {
        newTimeRemaining = Math.max(0, roomData.time_remaining + minutes);
      } else {
        // Calculate actual remaining time based on elapsed time and pause state
        const now = new Date();
        const gameStartTime = new Date(roomData.game_started_at);
        const totalDuration = roomData.time_remaining * 60; // in seconds
        const accumulatedPauseTime = roomData.accumulated_pause_time || 0;

        let elapsedSeconds = Math.floor((now - gameStartTime) / 1000);

        // If game is currently paused, account for current pause duration
        if (roomData.game_paused && roomData.paused_at) {
          const pausedAt = new Date(roomData.paused_at);
          const currentPauseDuration = Math.floor((now - pausedAt) / 1000);
          elapsedSeconds -= (accumulatedPauseTime + currentPauseDuration);
        } else {
          elapsedSeconds -= accumulatedPauseTime;
        }

        const currentRemainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
        const currentRemainingMinutes = currentRemainingSeconds / 60;

        // Add the adjustment to the actual remaining time
        newTimeRemaining = Math.max(0, Math.ceil(currentRemainingMinutes + minutes));
      }

      const response = await authFetch(`/rooms/${gamecode}/time`, {
        method: 'POST',
        body: JSON.stringify({
          time_remaining: newTimeRemaining,
          reset_timer: !!roomData.game_started_at  // Only reset timer if game has started
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to adjust time');
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
        <div className="controls-grid">
          <button
            className={`btn ${roomData?.game_paused ? 'btn-resume' : 'btn-pause'}`}
            onClick={handlePauseResume}
          >
            {roomData?.game_paused ? 'Resume' : 'Pause'}
          </button>

          <button className="btn btn-end-game" onClick={handleEndGame}>
            End Game
          </button>

          <div className="time-control-group">
            <input
              type="number"
              className="time-input-compact"
              placeholder="± Min"
              value={timeAdjustment}
              onChange={(e) => setTimeAdjustment(e.target.value)}
            />
            <button className="btn-icon btn-adjust-time" onClick={handleAdjustTime} title="Adjust time">
              ⏱
            </button>
          </div>
        </div>
      </div>

      <div className="teams-container">
        <h2>Teams in Game ({roomData?.teams?.length || 0})</h2>
        {roomData?.teams && roomData.teams.length > 0 ? (
          <div className="teams-list">
            {roomData.teams.map((team, index) => (
              <div key={index} className="team-item">
                <div className="team-info">
                  <div className="team-name">{team.team_name}</div>
                  <div className="team-circumstance">{team.circumstance}</div>
                </div>
                <button
                  className="btn-view-board"
                  onClick={() => navigate(`/game/${gamecode}/${team.team_name}`, {
                    state: {
                      boardConfig: roomData.board_config,
                      isGamemaster: true,
                      gamecode: gamecode
                    }
                  })}
                >
                  View Board
                </button>
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
