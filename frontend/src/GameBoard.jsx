import React, { useState, useRef, useEffect } from "react";
import "./App.css";

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
  const ringData = [
    {
      id: 'ring0',
      innerRadius: 200,
      outerRadius: 350,
      labels: [
        "Action 1",
        "Action 2",
        "Action 3",
        "Action 4",
        "Action 5",
        "Action 6",
        "Action 7",
        "Action 8",
        "Action 9",
        "Action 10",],

      colors: ["#ffc072", "#ffb088", "#ffc072", "#ffb088", "#d79543", "#d79543", "#d79543", "#e17f4d", "#e17f4d", "#e17f4d"],
      charLimit: 9
    },
    {
      id: 'ring1',
      innerRadius: 350,
      outerRadius: 500,
            labels: [
        "Action 11",
        "Action 12",
        "Action 13",
        "Action 14",
        "Action 15",
        "Action 16",
        "Action 17",
        "Action 18",
        "Action 19",
        "Action 20"
      ],
      colors: ["#a3d7ff", "#a0b8ca", "#a0b8ca", "#a0b8ca", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a0b8ca", "#a0b8ca"],
      charLimit: 19
    },
    {
      id: 'ring2',
      innerRadius: 500,
      outerRadius: 650,
      labels: [
        "Action 21",
        "Action 22",
        "Action 23",
        "Action 24",
        "Action 25",
        "Action 26",
        "Action 27",
        "Action 28",
        "Action 29",
        "Action 30"
      ],
      colors: ["#bb98d5", "#bb98d5", "#bb98d5", "#a872d1", "#e4c1ff", "#5375d0", "#5375d0", "#9fb9ff", "#7e9ef3", "#9fb9ff", "#7e9ef3", "#7892d8", "#7892d8", "#89bd8d", "#89b38d", "#89b38d", "#89b38d", "#659d69", "#659d69", "#659d69", "#89b38d", "#89b38d", "#89b38d"],
      charLimit: 13
    },
    {
      id: 'ring3',
      innerRadius: 650,
      outerRadius: 800,
            labels: [
        "Action 31",
        "Action 32",
        "Action 33",
        "Action 34",
        "Action 35",
        "Action 36",
        "Action 37",
        "Action 38",
        "Action 39",
        "Action 40",
      ],
      colors: ["#da6363", "#da6363", "#ff8989", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a"],
      charLimit: 20
    }
  ];

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
      onSliceClick(label);
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
    const charLimit = ringData.find(r => r.id === ringId)?.charLimit || 15;
    
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
            {ringData.map((ring) => {
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
                    const color = ring.colors[i % ring.colors.length];
                    
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
                        {renderCurvedText(label, ring.innerRadius, ring.outerRadius, startAngle, endAngle, i, ring.id)}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
          <div className="start-circle">Start!</div>
        </div>
      </div>
    </>
  );
};

export default GameBoard;