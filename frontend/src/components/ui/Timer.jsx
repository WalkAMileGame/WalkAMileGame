import React, { useState, useEffect } from "react";

function Timer({ start, end, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!start || !end) return;

    const startTime = new Date(start);
    const endTime = new Date(end);

    const update = () => {
      const now = new Date();
      const remaining = Math.floor((endTime - now) / 1000);
      setTimeLeft(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && onEnd) onEnd();
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [start, end, onEnd]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return formatTime(timeLeft)
}

export default Timer;
