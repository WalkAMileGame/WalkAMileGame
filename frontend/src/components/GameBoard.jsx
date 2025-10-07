import React, { useState, useRef, useEffect } from "react";
import '../styles/App.css';
import GameBoardSettings from "./GameBoardSettings";
import EnergyMarkers from "./EnergyMarkers";

const GameBoard = () => {
  const [rotations, setRotations] = useState({
    ring0: 0,
    ring1: 0,
    ring2: 0,
    ring3: 0,
  });

  const [activeMarkers, setActiveMarkers] = useState(new Set());
  const [points, setPoints] = useState(0)

  useEffect(() => {
  fetch("http://localhost:8000/items")
    .then((res) => res.json())
    .then((data) => setPoints(data.values));
  }, []);

  const updatingPoints = (change = -1) => { // takes input number now
    fetch("http://localhost:8000/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ change }), 
    })
      .then((res) => res.json())
      .then((data) => setPoints(data.values));
  };
  
  const containerRef = useRef(null);

  // Data for all rings (from innermost to outermost)
  const [gameConfig, setGameConfig] = useState({
    name: 'Default Gameboard',
    ringData: [
      {
        id: 1,
        innerRadius: 200,
        outerRadius: 350,
        labels: [
          { id: 1, text: "Action 1", color: "#ffc072", energyvalue: 1 },
          { id: 2, text: "Action 2", color: "#ffb088", energyvalue: 1  },
          { id: 3, text: "Action 3", color: "#ffc072", energyvalue: 1  },
          { id: 4, text: "Action 4", color: "#ffb088", energyvalue: 1  },
          { id: 5, text: "Action 5", color: "#d79543", energyvalue: 1  },
          { id: 6, text: "Action 6", color: "#d79543", energyvalue: 1  },
          { id: 7, text: "Action 7", color: "#d79543", energyvalue: 1  },
          { id: 8, text: "Action 8", color: "#e17f4d", energyvalue: 1  },
          { id: 9, text: "Action 9", color: "#e17f4d", energyvalue: 1  },
          { id: 10, text: "Action 10", color: "#e17f4d", energyvalue: 1  }
        ]      
      },
      {
        id: 2,
        innerRadius: 350,
        outerRadius: 500,
              labels: [
          { id: 11, text: "Action ", color: "#a3d7ff", energyvalue: 1  },
          { id: 12, text: "Action 12", color: "#a0b8ca", energyvalue: 1  },
          { id: 13, text: "Action 13", color: "#a0b8ca", energyvalue: 1  },
          { id: 14, text: "Action 14", color: "#a0b8ca", energyvalue: 1  },
          { id: 15, text: "Action 15", color: "#a3d7ff", energyvalue: 1  },
          { id: 16, text: "Action 16", color: "#d3eafc", energyvalue: 1  },
          { id: 17, text: "Action 17", color: "#a3d7ff", energyvalue: 1  },
          { id: 18, text: "Action 18", color: "#d3eafc", energyvalue: 1  },
          { id: 19, text: "Action 19", color: "#a3d7ff", energyvalue: 1  },
          { id: 20, text: "Action 20", color: "#d3eafc", energyvalue: 1  }
        ],
      },
      {
        id: 3,
        innerRadius: 500,
        outerRadius: 650,
        labels: [
          { id: 21, text: "Action 21", color: "#bb98d5", energyvalue: 1  },
          { id: 22, text: "Action 22", color: "#bb98d5", energyvalue: 1  },
          { id: 23, text: "Action 23", color: "#bb98d5", energyvalue: 1  },
          { id: 24, text: "Action 24", color: "#a872d1", energyvalue: 1  },
          { id: 25, text: "Action 25", color: "#e4c1ff", energyvalue: 1  },
          { id: 26, text: "Action 26", color: "#5375d0", energyvalue: 1  },
          { id: 27, text: "Action 27", color: "#5375d0", energyvalue: 1  },
          { id: 28, text: "Action 28", color: "#9fb9ff", energyvalue: 1  },
          { id: 29, text: "Action 29", color: "#7e9ef3", energyvalue: 1  },
          { id: 30, text: "Action 30", color: "#9fb9ff", energyvalue: 1  }
        ],   
      },
      {
        id: 4,
        innerRadius: 650,
        outerRadius: 800,
              labels: [
          { id: 31, text: "Action 31", color: "#da6363", energyvalue: 1  },
          { id: 32, text: "Action 32", color: "#da6363", energyvalue: 1  },
          { id: 33, text: "Action 33", color: "#ff8989", energyvalue: 1  },
          { id: 34, text: "Action 34", color: "#da8a8a", energyvalue: 1  },
          { id: 35, text: "Action 35", color: "#da8a8a", energyvalue: 1  },
          { id: 36, text: "Action 36", color: "#da8a8a", energyvalue: 1  },
          { id: 37, text: "Action 37", color: "#da8a8a", energyvalue: 1  },
          { id: 38, text: "Action 38", color: "#da8a8a", energyvalue: 1  },
          { id: 39, text: "Action 39", color: "#da6363", energyvalue: 1  },
          { id: 40, text: "Action 40", color: "#da6363", energyvalue: 1  }
        ],   
      }
    ]
  });
  
  const whiteLineThickness = 14; // Stroke width for slice borders
  const blackLineThickness = 8; // Stroke width for separator circles

  const CENTER_X = 800 + whiteLineThickness; // Exact center X
  const CENTER_Y = 800 + whiteLineThickness; // Exact center Y
  const viewBoxSize = 1600 + whiteLineThickness * 2; // ViewBox size to fit all rings

// Settings

  const [showSettings, setShowSettings] = useState(false);

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

  // Handle slice click
  const handleSliceClick = (e, label) => {
    e.stopPropagation();
    
    if (dragState.current.isDragging || dragState.current.recentlyDragged) {
      return;
    }
    
    const hasMarker = activeMarkers.has(label.id);
    
    if (hasMarker) {
      updatingPoints(label.energyvalue); // Remove marker - refund energy
      setActiveMarkers(prev => {
        const newSet = new Set(prev);
        newSet.delete(label.id);
        return newSet;
      });
    } else if (points > 0) {
      updatingPoints(- label.energyvalue); // Add marker - spend energy
      setActiveMarkers(prev => new Set([...prev, label.id]));
    }
  }
  

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState.current.isDragging) return;

      dragState.current.recentlyDragged = true;
      
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
    };

    const handleMouseUp = () => {
    dragState.current.isDragging = false;
    
    setTimeout(() => {
      dragState.current.recentlyDragged = false;
    }, 100); 
    
    dragState.current.ringId = null;
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

      // const arcLength = textRadius * angleRad;
      // // Use a percentage of the arc length to provide some padding
      // const textLength = arcLength * 0.9;

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

  // eslint-disable-next-line no-unused-vars
  const getAnnularSectorPoints = (innerRadius, outerRadius, startAngleDeg, endAngleDeg) => {
    const startAngle = (startAngleDeg - 90) * Math.PI / 180;
    const endAngle = (endAngleDeg - 90) * Math.PI / 180;

    return {
        innerStart: {
            x: CENTER_X + innerRadius * Math.cos(startAngle),
            y: CENTER_Y + innerRadius * Math.sin(startAngle)
        },
        innerEnd: {
            x: CENTER_X + innerRadius * Math.cos(endAngle),
            y: CENTER_Y + innerRadius * Math.sin(endAngle)
        },
        outerStart: {
            x: CENTER_X + outerRadius * Math.cos(startAngle),
            y: CENTER_Y + outerRadius * Math.sin(startAngle)
        },
        outerEnd: {
            x: CENTER_X + outerRadius * Math.cos(endAngle),
            y: CENTER_Y + outerRadius * Math.sin(endAngle)
        }
    };
  };

  return (
    <>
      <div className="energypoints">
        Remaining energypoints: {points}
      </div>
      <div className="game-layout">
        {/* Settings Button */}
        <div className="settingsButton">
          <button 
            onClick={() => setShowSettings(!showSettings)}
          > 
            ⚙️
          </button>
        </div>

        {/* Main Content Area */}
        <div className={`main-content ${showSettings ? 'settings-open' : ''}`}>
          {/* Gameboard Container */}
          <div className={`gameboard-container ${showSettings ? 'shifted' : ''}`}>
            <div className="container">
              <div className="wheel-container" ref={containerRef}>
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
                        floodColor="#180707ff" // shadow color (white)
                      />
                    </filter>
                  </defs>            
                  {/* Render rings from innermost to outermost */}
                  {gameConfig.ringData.map((ring) => {
                    const numSlices = ring.labels.length;
                    const rotation = rotations[ring.id] || 0;
                    const anglePerSlice = 360 / numSlices;
                    
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
                          
                          return (
                            <g key={`${ring.id}-slice-${i}`}>
                              {/* Slice shape */}
                              <path
                                className={`slice-path ${dragState.current.ringId === ring.id ? 'dragging' : ''}`}
                                d={createAnnularSectorPath(ring.innerRadius, ring.outerRadius, startAngle, endAngle)}
                                fill={color}
                                stroke="#f5f2d0"
                                strokeWidth={whiteLineThickness}
                                onMouseDown={(e) => handleRingMouseDown(e, ring.id)}
                                onClick={(e) => handleSliceClick(e, label)}
                                style={{ cursor: "pointer" }}
                                filter="url(#whiteShadow)"
                              />
                              {/* Text */}
                              {renderCurvedText(label.text, ring.innerRadius, ring.outerRadius, startAngle, endAngle, i, ring.id)}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                {/* Separator Circles */}
                {gameConfig.ringData.map((ring) => (
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
                {gameConfig.ringData.length > 0 && (
                  <circle
                    key="separator-outer"
                    cx={CENTER_X}
                    cy={CENTER_Y}
                    r={gameConfig.ringData[gameConfig.ringData.length - 1].outerRadius}
                    fill="none"
                    stroke="black"
                    strokeWidth={whiteLineThickness * 2.1}
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
          </div>

          {/* Settings Panel */}
          <div className={`settings-panel ${showSettings ? 'open' : ''}`}>
            <GameBoardSettings
              gameConfig={gameConfig}
              onConfigChange={setGameConfig}
              onSave={(config) => console.log("save config", config)}
              isVisible={showSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>

        {/* Settings Overlay */}
        {showSettings && (
          <div className="settings-overlay" onClick={() => setShowSettings(false)} />
        )}
      </div>
    </>
  );
};

export default GameBoard;
