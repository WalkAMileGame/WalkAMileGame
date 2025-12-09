//ConnectionStatus.jsx
import { useState, useEffect } from 'react';
import { API_BASE } from '../../api';

const ConnectionStatus = () => {
  const [backendStatus, setBackendStatus] = useState('checking');

  const checkConnection = async () => {
    setBackendStatus('checking');
    try {
      const response = await fetch(`${API_BASE}/health`);

      if (response.ok) {
        const data = await response.json();

        if (data.status === 'healthy') {
          setBackendStatus('connected');
        } else if (data.status === 'unhealthy') {
          setBackendStatus('unhealthy');
        } else {
          setBackendStatus('error');
        }
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      setBackendStatus('disconnected');
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    connected: {
      text: 'ᯤ Connected',
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

  // Only show when disconnected, unhealthy, or error
  if (backendStatus === 'connected' || backendStatus === 'checking') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '65px',
      padding: '10px 20px',
      backgroundColor: '#FFF4E6',
      border: `2px solid ${currentConfig.color}`,
      borderRadius: '8px',
      color: currentConfig.color,
      fontWeight: 'bold',
      fontSize: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '300px'
    }}>
      {(backendStatus === 'disconnected' || backendStatus === 'error' || backendStatus === 'unhealthy') ? (
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span>ᯤ</span>
          <span style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '1em'
          }}>/</span>
        </span>
      ) : currentConfig.text}
    </div>
  );
};

export default ConnectionStatus;
