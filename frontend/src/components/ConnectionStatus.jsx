//ConnectionStatus.jsx
import { useState, useEffect } from 'react';

const ConnectionStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [statusMessage, setStatusMessage] = useState('');

  const checkConnection = async () => {
    setBackendStatus('checking');
    setStatusMessage('');
    
    try {
      const response = await fetch('http://localhost:8000/health');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === 'healthy') {
          setBackendStatus('connected');
          setStatusMessage(data.message);
        } else if (data.status === 'unhealthy') {
          setBackendStatus('unhealthy');
          setStatusMessage(data.message);
        } else {
          setBackendStatus('error');
          setStatusMessage('Unknown status received');
        }
      } else {
        setBackendStatus('error');
        setStatusMessage(`HTTP ${response.status}`);
      }
    } catch (error) {
      setBackendStatus('disconnected');
      setStatusMessage('Cannot reach backend server');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: {
      text: '✓ Backend Connected',
      color: '#22c55e'
    },
    unhealthy: {
      text: 'ヽ(`Д´)ﾉ Database Issue',
      color: '#f97316'
    },
    disconnected: {
      text: 'o(╥﹏╥)o Disconnected',
      color: '#ef4444'
    },
    error: {
      text: '(╯°□°)╯︵ ɹoɹɹƎ Error',
      color: '#ef4444'
    },
    checking: {
      text: '[¬º-°]¬ Checking...',
      color: '#6b7280'
    }
  };

  const currentConfig = statusConfig[backendStatus];

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      padding: '10px 20px',
      backgroundColor: 'white',
      border: `2px solid ${currentConfig.color}`,
      borderRadius: '8px',
      color: currentConfig.color,
      fontWeight: 'bold',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '300px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {currentConfig.text}
        
        <button
          onClick={checkConnection}
          style={{
            padding: '4px 12px',
            backgroundColor: currentConfig.color,
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
      
      {statusMessage && (
        <div style={{
          fontSize: '12px',
          fontWeight: 'normal',
          color: '#6b7280',
          fontStyle: 'italic'
        }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
