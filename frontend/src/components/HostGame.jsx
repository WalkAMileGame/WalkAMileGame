import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HostGame.css';

// Simple SVG Icons as components
const CopyIcon = ({ className }) => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const RefreshIcon = () => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);

export default function HostGamePage() {
  const navigate = useNavigate();
  const [selectedBoard, setSelectedBoard] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [boards, setBoards] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);

  // ADD THIS: Load gameboards when component mounts
  useEffect(() => {
    loadGameboards();
  }, []); // Empty dependency array means this runs once on mount

  const loadGameboards = async () => {
    setIsLoadingBoards(true);
    try {
        const response = await fetch("http://localhost:8000/load_all");
        const data = await response.json();
        setBoards(data);
    } catch (error) {
        console.error("Failed to load gameboards:", error);
    } finally {
        setIsLoadingBoards(false);
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGame = () => {
    if (!selectedBoard || !inviteCode) {
      alert('Please select a board and generate/enter an invite code');
      return;
    }
    const selectedBoardData = boards.find(board => board.name === selectedBoard);
    navigate('/gameboard', {
        state: { 
        boardConfig: selectedBoardData,
        inviteCode: inviteCode 
        }
  });
};

  return (
    <div className="host-game-container">
      <div className="host-game-card">
        <h1 className="host-game-title">
          Host a Game
        </h1>

        {/* Board Selection */}
        <div className="form-group">
            <label className="form-label">
                Select Board
            </label>
            {isLoadingBoards ? (
                <p className="select-input">Loading boards...</p>
            ) : (
                <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="select-input"
                >
                <option value="">Choose a board...</option>
                {boards.map((board) => (
                    <option key={board.name} value={board.name}>
                    {board.name}
                    </option>
                ))}
                </select>
            )}
        </div>

        {/* Invite Code Section */}
        <div className="form-group">
          <label className="form-label">
            Invite Code
          </label>
          <div className="input-group">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter or generate code"
              className="text-input"
              maxLength={10}
            />
            <button
              onClick={copyToClipboard}
              disabled={!inviteCode}
              className="btn btn-copy"
              title="Copy to clipboard"
            >
              <CopyIcon className={copied ? 'icon-copied' : 'icon-default'} />
            </button>
          </div>
          <button
            onClick={generateCode}
            className="btn btn-generate"
          >
            <RefreshIcon />
            Generate Random Code
          </button>
        </div>

        {/* Game Info Display */}
        {selectedBoard && inviteCode && (
          <div className="game-details">
            <h3>Game Details:</h3>
            <p>Board: <span>{selectedBoard}</span></p>
            <p>Code: <span>{inviteCode}</span></p>
          </div>
        )}

        {/* Start Game Button */}
        <button
          onClick={handleStartGame}
          className="btn btn-start"
        >
          Start Game
        </button>

        {/* Instructions */}
        <div className="instructions">
          <h3>How to use:</h3>
          <ul>
            <li>1. Select a board from the dropdown</li>
            <li>2. Generate a code or enter your own</li>
            <li>3. Share the code with other players</li>
            <li>4. Click "Start Game" when ready</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
