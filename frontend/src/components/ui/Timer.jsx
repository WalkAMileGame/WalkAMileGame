import React, { useState, useEffect } from "react";
import { API_BASE } from "../../api";

function Timer({ gamecode, onEnd, onTimeUpdate }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Call onTimeUpdate whenever timeLeft changes
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(timeLeft);
    }
  }, [timeLeft, onTimeUpdate]);

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
          console.log('Game paused:', roomData.game_paused);

          const now = new Date();
          let endTime;

          if (roomData.game_started_at) {
            // Game has started - calculate based on elapsed time
            const gameStartTime = new Date(roomData.game_started_at);
            const totalDuration = roomData.time_remaining * 60; // Total duration in seconds
            const accumulatedPauseTime = roomData.accumulated_pause_time || 0;

            let elapsedSeconds = Math.floor((now - gameStartTime) / 1000);

            // If game is currently paused, calculate pause time
            if (roomData.game_paused && roomData.paused_at) {
              const pausedAt = new Date(roomData.paused_at);
              const currentPauseDuration = Math.floor((now - pausedAt) / 1000);
              elapsedSeconds -= (accumulatedPauseTime + currentPauseDuration);
            } else {
              // Subtract accumulated pause time from elapsed time
              elapsedSeconds -= accumulatedPauseTime;
            }

            const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

            console.log('Game started:', gameStartTime.toISOString());
            console.log('Elapsed seconds:', elapsedSeconds);
            console.log('Accumulated pause time:', accumulatedPauseTime);
            console.log('Remaining seconds:', remainingSeconds);

            endTime = new Date(gameStartTime.getTime() + (totalDuration + accumulatedPauseTime) * 1000);
            setTimeLeft(remainingSeconds);
          } else {
            // Game hasn't started yet - use full duration
            const totalDuration = roomData.time_remaining * 60;
            endTime = new Date(now.getTime() + totalDuration * 1000);
            setTimeLeft(totalDuration);
          }

          setIsLoading(false);

          // Start countdown - only tick if not paused
          const update = () => {
            // Fetch fresh data to check pause state
            fetch(`${API_BASE}/rooms/${gamecode}`)
              .then(res => res.json())
              .then(roomData => {
                if (roomData.game_paused) {
                  // Don't update time if paused - keep the fetch to detect resume
                  return;
                }

                const now = new Date();
                const gameStartTime = new Date(roomData.game_started_at);
                const totalDuration = roomData.time_remaining * 60;
                const accumulatedPauseTime = roomData.accumulated_pause_time || 0;
                let elapsedSeconds = Math.floor((now - gameStartTime) / 1000) - accumulatedPauseTime;
                const remainingSeconds = Math.max(0, totalDuration - elapsedSeconds);

                setTimeLeft(remainingSeconds);
                if (remainingSeconds <= 0 && onEnd) onEnd();
              });
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
