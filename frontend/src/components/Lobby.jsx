import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function Lobby() {
  const { gamecode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [screen, setScreen] = useState('initial');
  const [playerName, setPlayerName] = useState('');
  const [inputName, setInputName] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const [isGamemaster, setIsGamemaster] = useState(false);
  
  const boardConfig = location.state?.boardConfig;
  const inviteCode = location.state?.inviteCode || gamecode;
  
  const [roomData, setRoomData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const allReady = players.length > 0 && players.every(p => p.isReady);
  const readyCount = players.filter(p => p.isReady).length;
  
  // Check if this is the gamemaster
  useEffect(() => {
    if (location.state?.isGamemaster) {
      setIsGamemaster(true);
      setPlayerName(location.state.gamemasterName || 'Gamemaster');
      createRoom();
    } else if (gamecode) {
      setScreen('join');
    }
  }, [location.state, gamecode]);

  // Poll for room updates every 2 seconds when in lobby
  useEffect(() => {
    if (screen === 'waiting' && inviteCode) {
      loadRoomData();
      const interval = setInterval(loadRoomData, 2000);
      return () => clearInterval(interval);
    }
  }, [screen, inviteCode]);

  // Check if game has started
  useEffect(() => {
    if (roomData?.gameStarted && !isGamemaster) {
      // Players get redirected to game automatically
      navigate(`/game/${inviteCode}`, {
        state: { 
          boardConfig: roomData.boardConfig,
          inviteCode: inviteCode,
          players: roomData.players
        }
      });
    }
  }, [roomData?.gameStarted]);

  const generatePlayerId = () => {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Create room (gamemaster only)
  const createRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: inviteCode,
          boardConfig: location.state.boardConfig,
          gamemaster: location.state.gamemasterName,
          gamemasterName: location.state.gamemasterName
        })
      });
      
      if (response.ok) {
        setScreen('waiting');
        loadRoomData();
      } else {
        setError('Failed to create room');
      }
    } catch (err) {
      setError('Error creating room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load room data from database
  const loadRoomData = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}`);
      if (response.ok) {
        const data = await response.json();
        setRoomData(data);
        setPlayers(data.players || []);
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  // Join room (players)
  const joinRoom = async () => {
    if (!inputName.trim()) return;
    
    setLoading(true);
    const newPlayerId = generatePlayerId();
    
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: newPlayerId,
          playerName: inputName.trim()
        })
      });
      
      if (response.ok) {
        setCurrentPlayerId(newPlayerId);
        setPlayerName(inputName.trim());
        setScreen('waiting');
        loadRoomData();
      } else {
        const error = await response.json();
        setError(error.message || 'Failed to join room');
      }
    } catch (err) {
      setError('Error joining room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle ready status
  const toggleReady = async () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    try {
      await fetch(`${API_BASE}/rooms/${inviteCode}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: currentPlayerId,
          isReady: newReadyState
        })
      });
      // Room data will update on next poll
    } catch (err) {
      console.error('Error toggling ready:', err);
      setIsReady(!newReadyState); // Revert on error
    }
  };

  // Start game (gamemaster only)
  const startGame = async () => {
    try {
      const response = await fetch(`${API_BASE}/rooms/${inviteCode}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        navigate(`/game/${inviteCode}`, {
          state: { 
            boardConfig: roomData.boardConfig,
            inviteCode: inviteCode,
            players: roomData.players,
            isGamemaster: true
          }
        });
      }
    } catch (err) {
      setError('Error starting game: ' + err.message);
    }
  };

  // Join Screen
  if (screen === 'join') {
    return (
      <div className="min-h-screen bg-[#3F695D] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#3F695D] mb-2">Join Game</h1>
            <div className="bg-[#E9C46A] text-[#3F695D] font-bold text-2xl py-3 px-6 rounded-lg inline-block tracking-wider mb-2">
              {inviteCode}
            </div>
            <p className="text-[#86B18A]">Enter your name to join</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#E76F51]/20 border-2 border-[#E76F51] rounded-lg text-[#E76F51] text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[#3F695D] font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 rounded-lg border-2 border-[#86B18A] focus:outline-none focus:border-[#E9C46A] text-[#3F695D]"
                maxLength={20}
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={!inputName.trim() || loading}
              className="w-full py-4 rounded-lg font-semibold text-white transition-all"
              style={{
                backgroundColor: (inputName.trim() && !loading) ? '#86B18A' : '#d1d5db',
                cursor: (inputName.trim() && !loading) ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby
  return (
    <div className="min-h-screen bg-[#3F695D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-[#3F695D] mb-2">Lobby</h1>
          <div className="bg-[#E9C46A] text-[#3F695D] font-bold text-2xl py-3 px-6 rounded-lg inline-block tracking-wider">
            {inviteCode}
          </div>
          <p className="text-[#86B18A] mt-2">Share this code with players</p>
          {roomData?.boardConfig && (
            <p className="text-[#3F695D] mt-1 text-sm">
              Board: <span className="font-semibold">{roomData.boardConfig.name}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#E76F51]/20 border-2 border-[#E76F51] rounded-lg text-[#E76F51] text-sm">
            {error}
          </div>
        )}

        {/* Gamemaster Section */}
        {isGamemaster && roomData && (
          <div className="bg-[#E9C46A]/20 rounded-lg p-4 mb-6 border-2 border-[#E9C46A]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg bg-[#E9C46A]">
                {roomData.gamemasterName?.charAt(0).toUpperCase() || 'G'}
              </div>
              <div>
                <div className="text-[#3F695D] font-semibold flex items-center gap-2">
                  {roomData.gamemasterName || playerName}
                  <span className="text-xs bg-[#E9C46A] text-[#3F695D] px-2 py-1 rounded-full font-medium">
                    Gamemaster
                  </span>
                </div>
                <div className="text-sm text-[#3F695D]">
                  Controlling the game
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        {players.length > 0 && (
          <div className="bg-[#86B18A]/10 rounded-lg p-4 mb-6 border-2 border-[#86B18A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#3F695D] font-medium">Players Ready</span>
              <span className="text-[#E76F51] font-bold text-lg">{readyCount} / {players.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-[#86B18A] h-3 rounded-full transition-all duration-300"
                style={{ width: `${(readyCount / players.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Players List */}
        {players.length === 0 ? (
          <div className="text-center py-8 text-[#86B18A] bg-gray-50 rounded-lg border-2 border-dashed border-[#86B18A]">
            Waiting for players to join...
            {isGamemaster && (
              <p className="text-sm mt-2 text-[#3F695D]">
                Share the room code: <span className="font-bold">{inviteCode}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {players.map((player) => (
              <div
                key={player.id}
                className={`rounded-lg p-4 border-2 flex items-center justify-between transition-colors ${
                  player.id === currentPlayerId 
                    ? 'bg-[#86B18A]/20 border-[#86B18A]' 
                    : 'bg-gray-50 border-[#86B18A] hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                    style={{ backgroundColor: player.isReady ? '#86B18A' : '#F3A261' }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[#3F695D] font-semibold flex items-center gap-2">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-xs bg-[#86B18A] text-white px-2 py-1 rounded-full font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: player.isReady ? '#86B18A' : '#F3A261' }}>
                      {player.isReady ? '✓ Ready' : '○ Not ready'}
                    </div>
                  </div>
                </div>
                <div className="text-2xl">
                  {player.isReady ? '✓' : '○'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isGamemaster && (
            <button
              onClick={toggleReady}
              className="w-full py-4 rounded-lg font-semibold text-white transition-all"
              style={{ backgroundColor: isReady ? '#E76F51' : '#86B18A' }}
            >
              {isReady ? 'Not Ready' : 'Ready Up'}
            </button>
          )}
          
          {isGamemaster && (
            <button
              onClick={startGame}
              disabled={!allReady}
              className="w-full py-4 rounded-lg font-semibold transition-all"
              style={{
                backgroundColor: allReady ? '#E9C46A' : '#d1d5db',
                color: allReady ? '#3F695D' : '#9ca3af',
                cursor: allReady ? 'pointer' : 'not-allowed'
              }}
            >
              {allReady ? 'Start Game' : players.length === 0 ? 'Waiting for players to join...' : 'Waiting for players to be ready...'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
