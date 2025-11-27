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
  const [currentTeam, setCurrentTeam] = useState(null);
  const [leftTeamName, setLeftTeamName] = useState(null);
  const [rightTeamName, setRightTeamName] = useState(null);

  const [leftMistakes, setLeftMistakes] = useState([]);
  const [rightMistakes, setRightMistakes] = useState([]);
  const [leftGameConfig, setLeftGameConfig] = useState({ ringData: [] });
  const [rightGameConfig, setRightGameConfig] = useState({ ringData: [] });
  const [leftActiveMarkers, setLeftActiveMarkers] = useState(new Set());
  const [rightActiveMarkers, setRightActiveMarkers] = useState(new Set());

  // Zoom and pan state for left board
  const [leftZoom, setLeftZoom] = useState(1);
  const [leftPan, setLeftPan] = useState({ x: 0, y: 0 });

  // Zoom and pan state for right board
  const [rightZoom, setRightZoom] = useState(1);
  const [rightPan, setRightPan] = useState({ x: 0, y: 0 });

  // Pan state for both boards
  const leftPanState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const rightPanState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  // Rotation state for rings
  const [leftRotations, setLeftRotations] = useState({ ring0: 0, ring1: 0, ring2: 0, ring3: 0 });
  const [rightRotations, setRightRotations] = useState({ ring0: 0, ring1: 0, ring2: 0, ring3: 0 });

  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);

  // Drag state for ring rotation using useRef
  const leftDragState = useRef({
    isDragging: false,
    ringId: null,
    startAngle: 0,
    startRotation: 0
  });

  const rightDragState = useRef({
    isDragging: false,
    ringId: null,
    startAngle: 0,
    startRotation: 0
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

          // Set current team (the team viewing the comparison)
          if (!currentTeam && data.teams && data.teams.length > 0) {
            setCurrentTeam(data.teams[0]);
            setLeftTeamName(data.teams[0].team_name);
            setRightTeamName(data.teams.length > 1 ? data.teams[1].team_name : data.teams[0].team_name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch room data:", err);
      }
    };

    fetchRoomData();
    const interval = setInterval(fetchRoomData, 2000);
    return () => clearInterval(interval);
  }, [gamecode, currentTeam]);

  // Load left team's board and mistakes
  useEffect(() => {
    if (!leftTeamName) return;

    const fetchLeftTeamData = async () => {
      try {
        const boardRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${leftTeamName}/board`);
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setLeftGameConfig(boardData);
          setLeftActiveMarkers(restoreEnergyMarkers(boardData));
        }

        const mistakesRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${leftTeamName}/mistakes`);
        if (mistakesRes.ok) {
          const mistakesData = await mistakesRes.json();
          setLeftMistakes(mistakesData.mistakes || []);
        }
      } catch (err) {
        console.error("Failed to fetch left team data:", err);
      }
    };

    fetchLeftTeamData();
  }, [leftTeamName, gamecode]);

  // Load right team's board and mistakes
  useEffect(() => {
    if (!rightTeamName) return;

    const fetchRightTeamData = async () => {
      try {
        const boardRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${rightTeamName}/board`);
        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setRightGameConfig(boardData);
          setRightActiveMarkers(restoreEnergyMarkers(boardData));
        }

        const mistakesRes = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${rightTeamName}/mistakes`);
        if (mistakesRes.ok) {
          const mistakesData = await mistakesRes.json();
          setRightMistakes(mistakesData.mistakes || []);
        }
      } catch (err) {
        console.error("Failed to fetch right team data:", err);
      }
    };

    fetchRightTeamData();
  }, [rightTeamName, gamecode]);

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

  // Helper function to get angle from mouse position
  const getAngleFromMouse = (clientX, clientY, containerRef) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    return angle;
  };

  // Ring rotation handlers for left board
  const handleLeftRingMouseDown = (e, ringId) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const angle = getAngleFromMouse(e.clientX, e.clientY, leftContainerRef);
    leftDragState.current = {
      isDragging: true,
      ringId,
      startAngle: angle,
      startRotation: leftRotations[ringId] || 0
    };
  };

  // Ring rotation handlers for right board
  const handleRightRingMouseDown = (e, ringId) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const angle = getAngleFromMouse(e.clientX, e.clientY, rightContainerRef);
    rightDragState.current = {
      isDragging: true,
      ringId,
      startAngle: angle,
      startRotation: rightRotations[ringId] || 0
    };
  };

  // Pan handlers for left board
  const handleLeftPanStart = (e) => {
    if (e.button === 2) { // Right mouse button
      e.preventDefault();
      leftPanState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: leftPan.x,
        startPanY: leftPan.y
      };
      if (leftContainerRef.current) {
        leftContainerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  // Pan handlers for right board
  const handleRightPanStart = (e) => {
    if (e.button === 2) { // Right mouse button
      e.preventDefault();
      rightPanState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: rightPan.x,
        startPanY: rightPan.y
      };
      if (rightContainerRef.current) {
        rightContainerRef.current.style.cursor = 'grabbing';
      }
    }
  };

  const handleLeftPanEnd = () => {
    if (leftPanState.current.isPanning) {
      leftPanState.current.isPanning = false;
      if (leftContainerRef.current) {
        leftContainerRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleRightPanEnd = () => {
    if (rightPanState.current.isPanning) {
      rightPanState.current.isPanning = false;
      if (rightContainerRef.current) {
        rightContainerRef.current.style.cursor = 'grab';
      }
    }
  };

  // Set up mouse event listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Handle left board ring rotation
      if (leftDragState.current.isDragging) {
        const currentAngle = getAngleFromMouse(e.clientX, e.clientY, leftContainerRef);
        let deltaAngle = currentAngle - leftDragState.current.startAngle;

        // Handle angle wrap-around
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;

        const newRotation = leftDragState.current.startRotation + deltaAngle;

        setLeftRotations(prev => ({
          ...prev,
          [leftDragState.current.ringId]: newRotation
        }));
      }

      // Handle right board ring rotation
      if (rightDragState.current.isDragging) {
        const currentAngle = getAngleFromMouse(e.clientX, e.clientY, rightContainerRef);
        let deltaAngle = currentAngle - rightDragState.current.startAngle;

        // Handle angle wrap-around
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;

        const newRotation = rightDragState.current.startRotation + deltaAngle;

        setRightRotations(prev => ({
          ...prev,
          [rightDragState.current.ringId]: newRotation
        }));
      }

      // Handle left board panning
      if (leftPanState.current.isPanning) {
        e.preventDefault();
        const deltaX = e.clientX - leftPanState.current.startX;
        const deltaY = e.clientY - leftPanState.current.startY;

        setLeftPan({
          x: leftPanState.current.startPanX + deltaX,
          y: leftPanState.current.startPanY + deltaY
        });
      }

      // Handle right board panning
      if (rightPanState.current.isPanning) {
        e.preventDefault();
        const deltaX = e.clientX - rightPanState.current.startX;
        const deltaY = e.clientY - rightPanState.current.startY;

        setRightPan({
          x: rightPanState.current.startPanX + deltaX,
          y: rightPanState.current.startPanY + deltaY
        });
      }
    };

    const handleMouseUp = () => {
      leftDragState.current.isDragging = false;
      leftDragState.current.ringId = null;
      rightDragState.current.isDragging = false;
      rightDragState.current.ringId = null;
      handleLeftPanEnd();
      handleRightPanEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
  const isMistake = (mistakes, ringId, labelId) => {
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

  // Render a single board
  const renderBoard = (side, gameConfig, activeMarkers, mistakes, rotations, zoom, pan, containerRef) => {
    const handleZoomIn = () => {
      if (side === 'left') {
        setLeftZoom(prev => Math.min(prev + 0.2, 2));
      } else {
        setRightZoom(prev => Math.min(prev + 0.2, 2));
      }
    };

    const handleZoomOut = () => {
      if (side === 'left') {
        setLeftZoom(prev => Math.max(prev - 0.2, 0.5));
      } else {
        setRightZoom(prev => Math.max(prev - 0.2, 0.5));
      }
    };

    const handleResetView = () => {
      if (side === 'left') {
        setLeftZoom(1);
        setLeftPan({ x: 0, y: 0 });
      } else {
        setRightZoom(1);
        setRightPan({ x: 0, y: 0 });
      }
    };

    return (
      <div className="comparison-board-section">
        <div className="comparison-gameboard-container">
          <div className="comparison-board-wrapper">
            <div
              className="comparison-wheel-inner"
              ref={containerRef}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: (side === 'left' ? leftPanState : rightPanState).current.isPanning ? 'none' : 'transform 0.2s ease',
                transformOrigin: 'center',
                cursor: 'grab'
              }}
              onMouseDown={side === 'left' ? handleLeftPanStart : handleRightPanStart}
              onContextMenu={(e) => e.preventDefault()}
            >
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <filter id={`whiteShadow-${side}`}>
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f5f5f3ff" />
                  </filter>
                </defs>

                {/* Render rings */}
                {gameConfig?.ringData?.map((ring) => {
                  // Count title tiles as 2 units, normal tiles as 1
                  const totalAngleUnits = ring.labels.reduce((acc, label) => {
                    return acc + (label.tileType === 'ring_title' ? 2 : 1);
                  }, 0);

                  const baseAnglePerUnit = 360 / totalAngleUnits;
                  const rotation = rotations[ring.id] || 0;

                  let cumulativeAngle = 0;

                  return (
                    <g
                      key={ring.id}
                      transform={`rotate(${rotation} ${CENTER_X} ${CENTER_Y})`}
                    >
                      {/* Render slices */}
                      {ring.labels.map((label, i) => {
                        const isTitleSlice = label.tileType === 'ring_title';
                        const sliceAngle = isTitleSlice ? baseAnglePerUnit * 2 : baseAnglePerUnit;

                        const startAngle = cumulativeAngle;
                        const endAngle = cumulativeAngle + sliceAngle;
                        cumulativeAngle = endAngle;

                        const color = label.color;
                        const isError = isMistake(mistakes, ring.id, label.id);

                        return (
                          <g key={`${ring.id}-slice-${i}`}>
                            {/* Slice shape */}
                            <path
                              className="comparison-slice-path"
                              d={createAnnularSectorPath(ring.innerRadius, ring.outerRadius, startAngle, endAngle)}
                              fill={color}
                              stroke="#f5f5f3ff"
                              strokeWidth={whiteLineThickness}
                              style={{ cursor: "grab" }}
                              filter={`url(#whiteShadow-${side})`}
                              onMouseDown={(e) => side === 'left' ? handleLeftRingMouseDown(e, ring.id) : handleRightRingMouseDown(e, ring.id)}
                            />
                            {/* Mistake overlay */}
                            {isError && (
                              <path
                                className="comparison-mistake-overlay"
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
              <div className="comparison-start-circle">Start!</div>
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
    );
  };

  if (!roomData) {
    return <div className="comparison-loading">Loading comparison...</div>;
  }

  if (!roomData.teams || roomData.teams.length === 0) {
    return <div className="comparison-error">No teams found in this game.</div>;
  }

  const leftTeam = roomData.teams.find(t => t.team_name === leftTeamName);
  const rightTeam = roomData.teams.find(t => t.team_name === rightTeamName);

  return (
    <div className="comparison-page">
      <div className="comparison-header">
        <h1>Game Comparison</h1>
      </div>

      <div className="comparison-controls">
        <div className="comparison-team-selector">
          <label>Left Board:</label>
          <select value={leftTeamName || ''} onChange={(e) => setLeftTeamName(e.target.value)}>
            {roomData.teams.map((team) => (
              <option key={team.team_name} value={team.team_name}>
                {team.team_name}
              </option>
            ))}
          </select>
          <div className="comparison-team-stats">
            <span>Circumstance: {leftTeam?.circumstance} Energy: {leftTeam?.current_energy}</span>
            <span className="mistakes">Mistakes: {leftMistakes.length}</span>
          </div>
        </div>

        <div className="comparison-team-selector">
          <label>Right Board:</label>
          <select value={rightTeamName || ''} onChange={(e) => setRightTeamName(e.target.value)}>
            {roomData.teams.map((team) => (
              <option key={team.team_name} value={team.team_name}>
                {team.team_name}
              </option>
            ))}
          </select>
          <div className="comparison-team-stats">
            <span>
            {leftTeam?.circumstance
              ? `Circumstance: ${leftTeam.circumstance}, `
              : `Circumstance: None,  `
            }
            Energy: {rightTeam?.current_energy}
            </span>
            <span className="mistakes">Mistakes: {rightMistakes.length}</span>
          </div>
        </div>
      </div>

      <div className="comparison-boards-container">
        {renderBoard('left', leftGameConfig, leftActiveMarkers, leftMistakes, leftRotations, leftZoom, leftPan, leftContainerRef)}
        {renderBoard('right', rightGameConfig, rightActiveMarkers, rightMistakes, rightRotations, rightZoom, rightPan, rightContainerRef)}
      </div>

      <div className="comparison-actions">
        {isGamemaster ? (
          <button onClick={handleCloseGame} className="comparison-close-button">
            Close Game & Delete Room
          </button>
        ) : (
          <button onClick={handleReturnHome} className="comparison-home-button">
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default GameComparison;
