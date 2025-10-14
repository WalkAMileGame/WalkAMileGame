import { useState, useEffect } from 'react';

const ConnectionStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkConnection = async () => {
    setBackendStatus('checking');
    try {
      const response = await fetch('http://localhost:8000/health');
      setBackendStatus(response.ok ? 'connected' : 'error');
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simple status display
  const statusText = {
    connected: '✓ Backend Connected',
    disconnected: 'o(╥﹏╥)o Disconnected',
    error: '(╯°□°)╯︵ ɹoɹɹƎ Error',
    checking: '[¬º-°]¬ Checking...'
  }[backendStatus];

  const statusColor = {
    connected: '#22c55e',
    disconnected: '#ef4444',
    error: '#f97316',
    checking: '#6b7280'
  }[backendStatus];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '10px 20px',
      backgroundColor: 'white',
      border: `2px solid ${statusColor}`,
      borderRadius: '8px',
      color: statusColor,
      fontWeight: 'bold',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {statusText}
      
      <button
        onClick={checkConnection}
        style={{
          padding: '4px 12px',
          backgroundColor: statusColor,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.target.style.opacity = '0.8'}
        onMouseOut={(e) => e.target.style.opacity = '1'}
      >
        Reconnect
      </button>
    </div>
  );
};

export default ConnectionStatus;
