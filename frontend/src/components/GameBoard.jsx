import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import GameBoardSettings from "./GameBoardSettings";

const GameBoard = ({ onSliceClick = () => {} }) => {
  const [rotations, setRotations] = useState({
    ring0: 0,
    ring1: 0,
    ring2: 0,
    ring3: 0,
  });
  
  const containerRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    ringId: null,
    startAngle: 0,
    startRotation: 0
  });

  // Data for all rings (from innermost to outermost)
  const [gameConfig, setGameConfig] = useState({
    name: 'Default Gameboard',
    ringData: [
      {
        id: 1,
        innerRadius: 200,
        outerRadius: 350,
        charLimit: 9,
        labels: [
          { id: 1, text: "Action 1", color: "#ffc072" },
          { id: 2, text: "Action 2", color: "#ffb088" },
          { id: 3, text: "Action 3", color: "#ffc072" },
          { id: 4, text: "Action 4", color: "#ffb088" },
          { id: 5, text: "Action 5", color: "#d79543" },
          { id: 6, text: "Action 6", color: "#d79543" },
          { id: 7, text: "Action 7", color: "#d79543" },
          { id: 8, text: "Action 8", color: "#e17f4d" },
          { id: 9, text: "Action 9", color: "#e17f4d" },
          { id: 10, text: "Action 10", color: "#e17f4d" }
        ]      
      },
      {
        id: 2,
        innerRadius: 350,
        outerRadius: 500,
        charLimit: 19,
              labels: [
          { id: 11, text: "Action 11", color: "#a3d7ff" },
          { id: 12, text: "Action 12", color: "#a0b8ca" },
          { id: 13, text: "Action 13", color: "#a0b8ca" },
          { id: 14, text: "Action 14", color: "#a0b8ca" },
          { id: 15, text: "Action 15", color: "#a3d7ff" },
          { id: 16, text: "Action 16", color: "#d3eafc" },
          { id: 17, text: "Action 17", color: "#a3d7ff" },
          { id: 18, text: "Action 18", color: "#d3eafc" },
          { id: 19, text: "Action 19", color: "#a3d7ff" },
          { id: 20, text: "Action 20", color: "#d3eafc" }
        ],
      },
      {
        id: 3,
        innerRadius: 500,
        outerRadius: 650,
        charLimit: 13,
        labels: [
          { id: 21, text: "Action 21", color: "#bb98d5" },
          { id: 22, text: "Action 22", color: "#bb98d5" },
          { id: 23, text: "Action 23", color: "#bb98d5" },
          { id: 24, text: "Action 24", color: "#a872d1" },
          { id: 25, text: "Action 25", color: "#e4c1ff" },
          { id: 26, text: "Action 26", color: "#5375d0" },
          { id: 27, text: "Action 27", color: "#5375d0" },
          { id: 28, text: "Action 28", color: "#9fb9ff" },
          { id: 29, text: "Action 29", color: "#7e9ef3" },
          { id: 30, text: "Action 30", color: "#9fb9ff" }
        ],   
      },
      {
        id: 4,
        innerRadius: 650,
        outerRadius: 800,
        charLimit: 20,
              labels: [
          { id: 31, text: "Action 31", color: "#da6363" },
          { id: 32, text: "Action 32", color: "#da6363" },
          { id: 33, text: "Action 33", color: "#ff8989" },
          { id: 34, text: "Action 34", color: "#da8a8a" },
          { id: 35, text: "Action 35", color: "#da8a8a" },
          { id: 36, text: "Action 36", color: "#da8a8a" },
          { id: 37, text: "Action 37", color: "#da8a8a" },
          { id: 38, text: "Action 38", color: "#da8a8a" },
          { id: 39, text: "Action 39", color: "#da6363" },
          { id: 40, text: "Action 40", color: "#da6363" }
        ],   
      }
    ]
  });
  
  const CENTER_X = 800; // Exact center X
  const CENTER_Y = 800; // Exact center Y
  const viewBoxSize = 1600;

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

  // Handle ring drag start
  const handleRingMouseDown = (e, ringId) => {
    e.preventDefault();
    e.stopPropagation();
    const angle = getAngleFromMouse(e.clientX, e.clientY);
    dragState.current = {
      isDragging: true,
      ringId,
      startAngle: angle,
      startRotation: rotations[ringId] || 0
    };
  };

  // Handle slice click
  const handleSliceClick = (e, label) => {
    e.stopPropagation();
    if (!dragState.current.isDragging) {
      onSliceClick(label.text);
    }
  };

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState.current.isDragging) return;
      
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
    const charLimit = gameConfig.ringData.find(r => r.id === ringId)?.charLimit || 15;
    
    // Split long text into lines
    const regex = new RegExp(`.{1,${charLimit}}`, 'g');
    const lines = text.length > charLimit ? text.match(regex) : [text];
    
    return lines.map((line, lineIndex) => {
      const textRadius = midRadius - (lineIndex * 12);
      if (textRadius < innerRadius + 10) return null;
      
      // Adjust angles to start from top
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
          <text dy="-20" style={{ pointerEvents: "none", userSelect: "none" }}>
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
    <div className="settingsButton">
      <button 
      onClick={() => setShowSettings(!showSettings)}
      variant="outline"
      size="lg"
      > Settings 
      </button>
    </div>
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
                          strokeWidth="8"
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
          </svg>
          <div className="start-circle">Start!</div>
        </div>
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSettings(false)} />
        )}
        <div
          className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
            showSettings ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <GameBoardSettings
            gameConfig={gameConfig}
            onConfigChange={setGameConfig}
            onSave={(config) => console.log("save config", config)}
            isVisible={showSettings}
          />
        </div>
      </div>
    </>
  );
};

export default GameBoard;

