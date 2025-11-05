import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";

function Timer({ gamecode, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gamecode) return;

    const fetchAndCalculateTimer = async () => {
      try {
        console.log('Fetching timer data for room:', gamecode);
        const response = await fetch(`${API_BASE}/rooms/${gamecode}`);
        
        if (response.ok) {
          const roomData = await response.json();
          console.log('Room data received:', roomData);
          console.log('Time remaining (minutes):', roomData.time_remaining);
          console.log('Game started at:', roomData.game_started_at);
          
          const now = new Date();
          let endTime;
          
          if (roomData.game_started_at) {
            // Game has started - calculate based on elapsed time
            const gameStartTime = new Date(roomData.game_started_at);
            const totalDuration = roomData.time_remaining * 60; // Total duration in seconds
            const elapsedSeconds = Math.floor((now - gameStartTime) / 1000);
            const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);
            
            console.log('Game started:', gameStartTime.toISOString());
            console.log('Elapsed seconds:', elapsedSeconds);
            console.log('Remaining seconds:', remainingSeconds);
            
            endTime = new Date(gameStartTime.getTime() + totalDuration * 1000);
            setTimeLeft(remainingSeconds);
          } else {
            // Game hasn't started yet - use full duration
            const totalDuration = roomData.time_remaining * 60;
            endTime = new Date(now.getTime() + totalDuration * 1000);
            setTimeLeft(totalDuration);
          }
          
          setIsLoading(false);
          
          // Start countdown
          const update = () => {
            const now = new Date();
            const remaining = Math.floor((endTime - now) / 1000);
            const newTimeLeft = remaining > 0 ? remaining : 0;
            setTimeLeft(newTimeLeft);
            if (newTimeLeft <= 0 && onEnd) onEnd();
          };

          const interval = setInterval(update, 1000);
          return () => clearInterval(interval);
        } else {
          console.error('Failed to fetch room data:', response.status);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching timer data:', err);
        setIsLoading(false);
      }
    };

    fetchAndCalculateTimer();
  }, [gamecode, onEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return 'Loading...';
  }

  return formatTime(timeLeft);
}

export default Timer;
