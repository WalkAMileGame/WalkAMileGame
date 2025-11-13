import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/GamemasterProgress.css';

const GamemasterProgress = () => {
  const { gamecode } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/rooms/${gamecode}`);
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
          <span className="timer">Time Remaining: {roomData?.time_remaining || 0} minutes</span>
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
