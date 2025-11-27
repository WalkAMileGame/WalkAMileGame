import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import '../styles/GameComparison.css';
import { API_BASE } from '../api';
import EnergyMarkers from "./ui/EnergyMarkers";
import ZoomControls from './ui/ZoomControls';

const GameComparison = () => {
  const { gamecode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isGamemaster = location.state?.isGamemaster || false;

  const [roomData, setRoomData] = useState(null);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [gameConfig, setGameConfig] = useState({ ringData: [] });
  const [activeMarkers, setActiveMarkers] = useState(new Set());

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Rotation state for rings
  const [rotations, setRotations] = useState({
    ring0: 0,
    ring1: 0,
    ring2: 0,
    ring3: 0,
  });

  const containerRef = useRef(null);
  const panState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const dragState = useRef({
    isDragging: false,
    ringId: null,
    startAngle: 0,
    startRotation: 0,
    recentlyDragged: false
  });

  const whiteLineThickness = 14;
  const blackLineThickness = 8;
  const CENTER_X = 800 + whiteLineThickness;
  const CENTER_Y = 800 + whiteLineThickness;
  const viewBoxSize = 1600 + whiteLineThickness * 2;

  // Fetch room data and poll for updates
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms/${gamecode}`);
        if (res.ok) {
          const data = await res.json();
          setRoomData(data);
        }
      } catch (err) {
        console.error("Failed to fetch room data:", err);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 2000);
    return () => clearInterval(interval);
  }, [gamecode]);

  // Load current team's board and mistakes
  useEffect(() => {
    if (!roomData?.teams || roomData.teams.length === 0) return;

    const currentTeam = roomData.teams[currentTeamIndex];
    if (!currentTeam) return;

    const fetchTeamData = async () => {
      try {
        // Fetch team board
        const boardRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${currentTeam.team_name}/board`);
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setGameConfig(boardData);
          setActiveMarkers(restoreEnergyMarkers(boardData));
        }

        // Fetch team mistakes
        const mistakesRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${currentTeam.team_name}/mistakes`);
        if (mistakesRes.ok) {
          const mistakesData = await mistakesRes.json();
          setMistakes(mistakesData.mistakes || []);
        }
      } catch (err) {
        console.error("Failed to fetch team data:", err);
      }
    };

    fetchTeamData();
  }, [roomData, currentTeamIndex, gamecode]);

  const restoreEnergyMarkers = (boardData) => {
    if (!boardData?.ringData) return new Set();

    const restored = new Set();
    boardData.ringData.forEach((ring) => {
      ring.labels.forEach((label) => {
        if (label.energypoint) {
          restored.add(`${ring.id}-${label.id}`);
        }
      });
    });
    return restored;
  };

  const handlePreviousTeam = () => {
    if (currentTeamIndex > 0) {
      setCurrentTeamIndex(currentTeamIndex - 1);
    }
  };

  const handleNextTeam = () => {
    if (roomData?.teams && currentTeamIndex < roomData.teams.length - 1) {
      setCurrentTeamIndex(currentTeamIndex + 1);
    }
  };

  const handleReturnHome = () => {
    window.location.href = '/';
  };

  const handleCloseGame = async () => {
    if (!window.confirm("Are you sure you want to close this game? This will delete the room and redirect all players to the homepage.")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rooms/${gamecode}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        alert("Failed to close game");
      }
    } catch (err) {
      console.error("Failed to close game:", err);
      alert("Failed to close game");
    }
  };

  // Check if mistake
  const isMistake = (ringId, labelId) => {
    return mistakes.some(m => m.ring_id === ringId && m.label_id === labelId);
  };

  // Board rendering functions
  const createAnnularSectorPath = (innerRadius, outerRadius, startAngleDeg, endAngleDeg) => {
    const startAngle = (startAngleDeg - 90) * Math.PI / 180;
    const endAngle = (endAngleDeg - 90) * Math.PI / 180;

    const x1Inner = CENTER_X + innerRadius * Math.cos(startAngle);
    const y1Inner = CENTER_Y + innerRadius * Math.sin(startAngle);
    const x2Inner = CENTER_X + innerRadius * Math.cos(endAngle);
    const y2Inner = CENTER_Y + innerRadius * Math.sin(endAngle);

    const x1Outer = CENTER_X + outerRadius * Math.cos(startAngle);
    const y1Outer = CENTER_Y + outerRadius * Math.sin(startAngle);
    const x2Outer = CENTER_X + outerRadius * Math.cos(endAngle);
    const y2Outer = CENTER_Y + outerRadius * Math.sin(endAngle);

    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";

    const path = [
      `M ${x1Inner} ${y1Inner}`,
      `L ${x1Outer} ${y1Outer}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
      `L ${x2Inner} ${y2Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
      `Z`
    ].join(' ');

    return path;
  };

  // Render text on curved path
  const renderCurvedText = (text, innerRadius, outerRadius, startAngleDeg, endAngleDeg, index, ringId) => {
    const midRadius = (innerRadius + outerRadius) / 2;
    const angleRad = (endAngleDeg - startAngleDeg) * (Math.PI / 180);

    const estimatedCharLimit = Math.floor((midRadius * angleRad) / 12);

    const splitTextIntoLines = (text, limit) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      if (text.length <= limit) {
        return [text];
      }

      for (const word of words) {
        if ((currentLine + word).length <= limit) {
          currentLine += `${word} `;
        } else {
          if (lines.length >= 5) {
            break;
          }
          lines.push(currentLine.trim());
          currentLine = `${word} `;
        }
      }
      lines.push(currentLine.trim());
      return lines.filter(line => line.length > 0);
    };

    const lines = splitTextIntoLines(text, estimatedCharLimit);

    return lines.map((line, lineIndex) => {
      const verticalOffset = (lineIndex - (lines.length - 1) / 2) * 20;
      const textRadius = midRadius - verticalOffset;

      if (textRadius > outerRadius - 15 || textRadius < innerRadius + 15) {
        return null;
      }

      const startAngle = (startAngleDeg - 90) * Math.PI / 180;
      const endAngle = (endAngleDeg - 90) * Math.PI / 180;

      const x1 = CENTER_X + textRadius * Math.cos(startAngle);
      const y1 = CENTER_Y + textRadius * Math.sin(startAngle);
      const x2 = CENTER_X + textRadius * Math.cos(endAngle);
      const y2 = CENTER_Y + textRadius * Math.sin(endAngle);

      const pathId = `textPath-${ringId}-${index}-${lineIndex}`;
      const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";

      return (
        <g key={pathId}>
          <defs>
            <path
              id={pathId}
              d={`M ${x1} ${y1} A ${textRadius} ${textRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
            />
          </defs>
          <text dy="8" style={{ pointerEvents: "none", userSelect: "none" }}>
            <textPath
              href={`#${pathId}`}
              startOffset="50%"
              textAnchor="middle"
              fill="#000"
              fontSize="20"
              fontWeight="600"
            >
              {line}
            </textPath>
          </text>
        </g>
      );
    });
  };

  // Get angle from mouse position
  const getAngleFromMouse = (clientX, clientY) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    return angle;
  };

  // Handle ring drag
  const handleRingMouseDown = (e, ringId) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const angle = getAngleFromMouse(e.clientX, e.clientY);
    dragState.current = {
      isDragging: true,
      ringId,
      startAngle: angle,
      startRotation: rotations[ringId] || 0,
      recentlyDragged: false
    };
  };

  // Pan handlers
  const handlePanStart = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      panState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handlePanEnd = () => {
    if (panState.current.isPanning) {
      panState.current.isPanning = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragState.current.isDragging) {
        dragState.current.recentlyDragged = true;

        const currentAngle = getAngleFromMouse(e.clientX, e.clientY);
        let deltaAngle = currentAngle - dragState.current.startAngle;

        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;

        const newRotation = dragState.current.startRotation + deltaAngle;

        setRotations(prev => ({
          ...prev,
          [dragState.current.ringId]: newRotation
        }));
      }

      if (panState.current.isPanning) {
        const deltaX = e.clientX - panState.current.startX;
        const deltaY = e.clientY - panState.current.startY;

        setPan({
          x: panState.current.startPanX + deltaX,
          y: panState.current.startPanY + deltaY
        });
      }
    };

    const handleMouseUp = () => {
      dragState.current.isDragging = false;

      setTimeout(() => {
        dragState.current.recentlyDragged = false;
      }, 100);

      dragState.current.ringId = null;
      handlePanEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (!roomData) {
    return <div className="comparison-loading">Loading comparison...</div>;
  }

  if (!roomData.teams || roomData.teams.length === 0) {
    return <div className="comparison-error">No teams found in this game.</div>;
  }

  const currentTeam = roomData.teams[currentTeamIndex];

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <h1>Game Comparison</h1>
        <div className="team-info">
          <h2>{currentTeam.team_name}</h2>
          <p className="circumstance">Circumstance: {currentTeam.circumstance}</p>
          <p className="energy-remaining">Energy Remaining: {currentTeam.current_energy}</p>
          <p className="mistakes-count">Mistakes: {mistakes.length}</p>
        </div>
      </div>

      <div className="comparison-navigation">
        <button
          onClick={handlePreviousTeam}
          disabled={currentTeamIndex === 0}
          className="nav-button"
        >
          Previous Team
        </button>
        <span className="team-counter">
          Team {currentTeamIndex + 1} of {roomData.teams.length}
        </span>
        <button
          onClick={handleNextTeam}
          disabled={currentTeamIndex === roomData.teams.length - 1}
          className="nav-button"
        >
          Next Team
        </button>
      </div>

      <div className="main-content">
        <div className="gameboard-container">
          <div
            className="container"
            ref={containerRef}
            onMouseDown={handlePanStart}
            onContextMenu={handleContextMenu}
            style={{ cursor: panState.current.isPanning ? 'grabbing' : 'grab' }}
          >
            <div
              className="wheel-container"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <filter id="whiteShadow">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f5f5f3ff" />
                  </filter>
                </defs>

                {/* Render rings */}
                {gameConfig?.ringData?.map((ring) => {
                  const numSlices = ring.labels.length;
                  const anglePerSlice = 360 / numSlices;
                  const rotation = rotations[ring.id] || 0;

                  return (
                    <g
                      key={ring.id}
                      transform={`rotate(${rotation} ${CENTER_X} ${CENTER_Y})`}
                    >
                      {/* Render slices */}
                      {ring.labels.map((label, i) => {
                        const startAngle = i * anglePerSlice;
                        const endAngle = (i + 1) * anglePerSlice;
                        const color = label.color;
                        const isError = isMistake(ring.id, label.id);

                        return (
                          <g key={`${ring.id}-slice-${i}`}>
                            {/* Slice shape */}
                            <path
                              className={`slice-path ${dragState.current.ringId === ring.id ? 'dragging' : ''}`}
                              d={createAnnularSectorPath(ring.innerRadius, ring.outerRadius, startAngle, endAngle)}
                              fill={color}
                              stroke="#f5f5f3ff"
                              strokeWidth={whiteLineThickness}
                              onMouseDown={(e) => handleRingMouseDown(e, ring.id)}
                              style={{ cursor: "grab" }}
                              filter="url(#whiteShadow)"
                            />
                            {/* Mistake overlay */}
                            {isError && (
                              <path
                                className="mistake-overlay"
                                d={createAnnularSectorPath(ring.innerRadius, ring.outerRadius, startAngle, endAngle)}
                                fill="rgba(255, 0, 0, 0.4)"
                                stroke="red"
                                strokeWidth={3}
                                style={{ pointerEvents: 'none' }}
                              />
                            )}
                            {/* Render Text */}
                            {renderCurvedText(label.text, ring.innerRadius, ring.outerRadius, startAngle, endAngle, i, ring.id)}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* Separator Circles */}
                {gameConfig?.ringData?.map((ring) => (
                  <circle
                    key={`separator-inner-${ring.id}`}
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={ring.innerRadius}
                    fill="none"
                    stroke="#464646ff"
                    strokeWidth={blackLineThickness}
                    style={{ pointerEvents: 'none' }}
                  />
                ))}
                {gameConfig?.ringData?.length > 0 && (
                  <circle
                    key="separator-outer"
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={gameConfig?.ringData[gameConfig.ringData.length - 1].outerRadius}
                    fill="none"
                    stroke="#464646ff"
                    strokeWidth={blackLineThickness}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Energy Markers */}
                <EnergyMarkers
                  gameConfig={gameConfig}
                  rotations={rotations}
                  activeMarkers={activeMarkers}
                  centerX={CENTER_X}
                  centerY={CENTER_Y}
                />
              </svg>
              <div className="start-circle">Start!</div>
            </div>
          </div>
          <ZoomControls
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReset={handleResetView}
            minZoom={0.5}
            maxZoom={2}
          />
        </div>
      </div>

      {mistakes.length > 0 && (
        <div className="mistakes-legend">
          <h3>Missing Required Tiles:</h3>
          <ul>
            {mistakes.map((mistake, idx) => (
              <li key={idx}>{mistake.tile_text}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="comparison-actions">
        {isGamemaster ? (
          <button onClick={handleCloseGame} className="close-game-button">
            Close Game & Delete Room
          </button>
        ) : (
          <button onClick={handleReturnHome} className="return-home-button">
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default GameComparison;
