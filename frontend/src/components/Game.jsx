import React, { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from 'react-router-dom';
import '../styles/Gameboard.css';
import { API_BASE } from '../api';
import EnergyMarkers from "./ui/EnergyMarkers";
import ZoomControls from './ui/ZoomControls';
import CircumstanceView from './ui/CircumstanceView';
import Timer from "./ui/Timer";



const Game = () => {
  const location = useLocation();
  const initialConfig = location.state?.boardConfig
  const [gameConfig, setGameConfig] = useState(initialConfig || { ringData: [] })
  const { gamecode, teamname } = useParams();


  const [rotations, setRotations] = useState({
    ring0: 0,
    ring1: 0,
    ring2: 0,
    ring3: 0,
  });

  const [activeMarkers, setActiveMarkers] = useState(new Set());
  const [points, setPoints] = useState(0)
  const [circumstance, setCircumstance] = useState({ name: '', description: '' });

  // fetch board && display energymarkers if energypoint true
  useEffect(() => {

    const fetchBoard = async () => {
      try {
        const res = await fetch(`${API_BASE}/rooms/${gamecode}/teams/${teamname}/board`);
        if (!res.ok) throw new Error("No board found for team");
        const data = await res.json();

        // Restore energymarkers
        const restored = restoreEnergyMarkers(data);
        setActiveMarkers(restored);
        setGameConfig(data);
      } catch (err) {
        console.warn("Board fetch skipped:", err.message);
      }
    };
    if (teamname !== "Gamemaster" && !initialConfig) {
    fetchBoard();
    restoreEnergyMarkers();
    }

  }, [gamecode, teamname, initialConfig]); 


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

 // fetching points and updating poins

 useEffect(() => {
  fetch(`${API_BASE}/rooms/${gamecode}/teams/${teamname}/energy`)
    .then((res) => res.json())
    .then((data) => setPoints(data.current_energy));
}, []);

  // Fetch team circumstance and its description
  useEffect(() => {
    const fetchCircumstance = async () => {
      try {
        // Get team's circumstance name from room data
        const roomRes = await fetch(`${API_BASE}/rooms/${gamecode}`);
        if (!roomRes.ok) return;

        const roomData = await roomRes.json();
        const team = roomData.teams.find(t => t.team_name === teamname);

        if (team?.circumstance) {
          // Fetch all circumstances to get the description
          const circumstancesRes = await fetch(`${API_BASE}/circumstances`);
          if (circumstancesRes.ok) {
            const circumstances = await circumstancesRes.json();
            const found = circumstances.find(c => c.name === team.circumstance);

            setCircumstance({
              name: team.circumstance,
              description: found?.description || ''
            });
          } else {
            setCircumstance({ name: team.circumstance, description: '' });
          }
        }
      } catch (err) {
        console.error("Failed to fetch circumstance:", err);
      }
    };

    fetchCircumstance();
  }, [gamecode, teamname]);

  const updatingPoints = (change = -1) => { // takes input number now
    fetch(`${API_BASE}/rooms/${gamecode}/teams/${teamname}/energy`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change }), 
    })
      .then((res) => res.json())
      .then((data) => setPoints(data.current_energy));
  };

    // Handle slice click
  const handleSliceClick = (e, label, ringId, energyvalue) => {
    e.stopPropagation();
    
    if (dragState.current.isDragging || dragState.current.recentlyDragged) {
      return;
    }
    const compositeKey = `${ringId}-${label.id}`;
    const hasMarker = activeMarkers.has(compositeKey);
    
    if (hasMarker) {
      updatingPoints(energyvalue); // Remove marker - refund energy
      setGameConfig((prev) => ({
      ...prev,
      rings: prev.ringData.map((ring) =>
        ring.id === ringId
          ? {
              ...ring,
              labels: ring.labels.map((l) =>
                l.id === label.id ? { ...l, energypoint: false } : l
              ),
            }
          : ring),
    }));
      setActiveMarkers(prev => {
        const newSet = new Set(prev);
        newSet.delete(compositeKey);
        return newSet;
      });
    } else if (points >= energyvalue) {
      updatingPoints(- energyvalue); // Add marker - spend energy
      setGameConfig((prev) => ({
      ...prev,
      rings: prev.ringData.map((ring) =>
        ring.id === ringId
          ? {
              ...ring,
              labels: ring.labels.map((l) =>
                l.id === label.id ? { ...l, energypoint: true } : l
              ),
            }
          : ring),
    }));
      setActiveMarkers(prev => new Set([...prev, compositeKey]));
    }
    setGameConfig(prev => {
      const updated = {
        ...prev,
        ringData: prev.ringData.map(ring => 
          ring.id == ringId
          ? {
            ...ring,
            labels: ring.labels.map(l =>
              l.id ==label.id 
              ? { ...l, energypoint: !hasMarker }
              : l
            ),
          }
          : ring
        ),
      }
    fetch(`${API_BASE}/rooms/${gamecode}/teams/${teamname}/board`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board_state: updated }),
  }).catch((err) => console.error("Failed to update board:", err));
  return updated;
})
};
  
  const containerRef = useRef(null);
  
  const whiteLineThickness = 14; // Stroke width for slice borders
  const blackLineThickness = 8; // Stroke width for separator circles


    // Add tooltip state
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const CENTER_X = 800 + whiteLineThickness; // Exact center X
  const CENTER_Y = 800 + whiteLineThickness; // Exact center Y
  const viewBoxSize = 1600 + whiteLineThickness * 2; // ViewBox size to fit all rings

// Settings


  // Helper function to create annular sector path (donut slice)
  const createAnnularSectorPath = (innerRadius, outerRadius, startAngleDeg, endAngleDeg) => {
    // Convert to radians
    const startAngle = (startAngleDeg - 90) * Math.PI / 180; // Subtract 90 to start from top
    const endAngle = (endAngleDeg - 90) * Math.PI / 180;

    // Calculate all points using the exact center    
    const x1Inner = CENTER_X + innerRadius * Math.cos(startAngle);
    const y1Inner = CENTER_Y + innerRadius * Math.sin(startAngle);
    const x2Inner = CENTER_X + innerRadius * Math.cos(endAngle);
    const y2Inner = CENTER_Y + innerRadius * Math.sin(endAngle);
    
    const x1Outer = CENTER_X + outerRadius * Math.cos(startAngle);
    const y1Outer = CENTER_Y + outerRadius * Math.sin(startAngle);
    const x2Outer = CENTER_X + outerRadius * Math.cos(endAngle);
    const y2Outer = CENTER_Y + outerRadius * Math.sin(endAngle);
    
    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? "0" : "1";
    
    // Build path
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

  // zoom and pan stuff
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panState = useRef({
    isPanning: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handlePanStart = (e) => {
    if (e.button === 2) { // Right mouse button
      e.preventDefault();
      panState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
      // Change cursor
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

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Prevent context menu on right click
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // Get angle from mouse position relative to center
  const getAngleFromMouse = (clientX, clientY) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    return angle;
  };

  const dragState = useRef({
    isDragging: false,
    ringId: null,
    startAngle: 0,
    startRotation: 0,
    recentlyDragged: false
  });

  // Handle ring drag start  
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
    // Clear tooltip when dragging
    setHoveredSlice(null);
  };


  // Handle slice hover for tooltip
  const handleSliceMouseEnter = (e, label, ringId, energyvalue) => {
    if (dragState.current.isDragging) return;
    setHoveredSlice({ ...label, ringId, energyvalue });
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSliceMouseLeave = () => {
    if (dragState.current.isDragging) return;
    setHoveredSlice(null);
  };

  const handleSliceMouseMove = (e) => {
    if (hoveredSlice && !dragState.current.isDragging) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
    // Handle ring rotation
    if (dragState.current.isDragging) {
      dragState.current.recentlyDragged = true;
      setHoveredSlice(null); // Clear tooltip while dragging
      
      const currentAngle = getAngleFromMouse(e.clientX, e.clientY);
      let deltaAngle = currentAngle - dragState.current.startAngle;
      
      // Handle angle wrap-around
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;
      
      const newRotation = dragState.current.startRotation + deltaAngle;
      
      setRotations(prev => ({
        ...prev,
        [dragState.current.ringId]: newRotation
      }));
    }
    
    // Handle panning (independent of ring dragging)
    if (panState.current.isPanning) {
      e.preventDefault();
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
  }, []);

  // Render text on curved path
  const renderCurvedText = (text, innerRadius, outerRadius, startAngleDeg, endAngleDeg, index, ringId) => {
    const midRadius = (innerRadius + outerRadius) / 2;
    const angleRad = (endAngleDeg - startAngleDeg) * (Math.PI / 180);

    // Estimate character limit based on available arc length and a guess for average char width
    const estimatedCharLimit = Math.floor((midRadius * angleRad) / 12);

    // Function to split text into lines without breaking words
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
          if (lines.length >= 5) { // Limit to 6 lines max
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
      // Position lines from the middle, stacking outwards/inwards
      const verticalOffset = (lineIndex - (lines.length - 1) / 2) * 20; // 20 is line height
      const textRadius = midRadius - verticalOffset;
      // Ensure text stays within the slice boundaries
      if (textRadius > outerRadius - 15 || textRadius < innerRadius + 15) {
        return null;
      }


      // Adjust angles to start from top for SVG path calculation
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



  return (
    <>
      <div className="energypoints" data-testid="energypoints">
        Remaining energypoints: {points}
      </div>
      <div className="game-layout">

    <div className="clock">
      <Timer gamecode={gamecode} />
    </div>

        {/* Main Content Area */}
        <div className={`main-content`}>
          {/* Gameboard Container */}
          <div className={`gameboard-container`}>
            <div className="container">
              <div className="wheel-container" 
                ref={containerRef} 
                onMouseDown={handlePanStart}
                onContextMenu={handleContextMenu}
                style={{ 
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                  transition: panState.current.isPanning ? 'none' : 'transform 0.2s ease',
                  transformOrigin: 'center',
                  cursor: 'grab'
                }}>
                <svg
                  className="wheel-svg"
                  viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="whiteShadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow 
                        dx="0" // horizontal offset
                        dy="0" // vertical offset
                        stdDeviation="10" // blur amount
                        floodColor="#111010ff" // shadow color (white)
                      />
                    </filter>
                  </defs>
                  {/* Render rings from innermost to outermost */}     
                  {gameConfig?.ringData?.map((ring) => {
                    const numSlices = ring.labels.length;
                    const rotation = rotations[ring.id] || 0;
                    const anglePerSlice = 360 / numSlices;
                    
                    return (
                      <g
                        data-testid={`ring-group-${ring.id}`}
                        key={ring.id}
                        transform={`rotate(${rotation} ${CENTER_X} ${CENTER_Y})`}
                      >
                        
                        {/* Render slices */}
                        {ring.labels.map((label, i) => {
                          const startAngle = i * anglePerSlice;
                          const endAngle = (i + 1) * anglePerSlice;
                          const color = label.color;
                          
                          return (
                            <g key={`${ring.id}-slice-${i}`}>
                              {/* Slice shape */}
                              <path
                                data-testid={`slice-${label.id}`}
                                className={`slice-path ${dragState.current.ringId === ring.id ? 'dragging' : ''}`}
                                d={createAnnularSectorPath(ring.innerRadius, ring.outerRadius, startAngle, endAngle)}
                                fill={color}
                                stroke="#f5f5f3ff"
                                strokeWidth={whiteLineThickness}
                                onMouseDown={(e) => handleRingMouseDown(e, ring.id)}
                                onClick={(e) => handleSliceClick(e, label, ring.id, label.energyvalue)}
                                onMouseEnter={(e) => handleSliceMouseEnter(e, label, ring.id, label.energyvalue)}
                                onMouseLeave={handleSliceMouseLeave}
                                onMouseMove={handleSliceMouseMove}
                                style={{ cursor: "pointer" }}
                                filter="url(#whiteShadow)"
                              />
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
                      stroke="black"
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
                      stroke="black"
                      strokeWidth={blackLineThickness}
                      style={{ pointerEvents: 'none' }}
                    />
                  )}
                {/* Simple Energy Markers - rendered on top */}
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


        {/* Tooltip */}
        {hoveredSlice && !dragState.current.isDragging && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPosition.x + 10,
              top: tooltipPosition.y + 10,
              backgroundColor: '#1f2937',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            {/* To show energy cost just change the ' ✓' into the energy cost variable */}
            {activeMarkers.has(`${hoveredSlice.ringId}-${hoveredSlice.id}`)
            ? `Refund: ${hoveredSlice.energyvalue}`
            : `Energy cost: ${hoveredSlice.energyvalue}`
            }
          </div>
        )}

        {/* Circumstance View */}
        <div style={{
          position: 'fixed',
          bottom: '120px',
          left: '20px',
          zIndex: 100
        }}>
          <CircumstanceView
            name={circumstance.name}
            description={circumstance.description}
          />
        </div>
      </div>
    </>
  );
};

export default Game;
