<<<<<<< HEAD:frontend/src/GameBoard.jsx
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
=======
import React from "react";
import { useState, useRef } from "react";
import "../App.css";

// ====================================================================================
// 1. Reusable Pie Chart Component
// This component draws one circle and receives all its data via props.
// ====================================================================================
const Circle = ({
  radius,
  labels,
  colors,
  onSliceClick,
  textStyle,
  charLimit,
  className = ""
}) => {
  const size = radius * 2;
  const center = radius;
  const numSlices = labels.length;

  return (
    <div className={`circle-ring ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* === Slice Shapes === */}
        {labels.map((label, i) => {
          const startAngle = (i * 360 / numSlices) * Math.PI / 180;
          const endAngle = ((i + 1) * 360 / numSlices) * Math.PI / 180;
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          const fill = colors[i % colors.length];
          return (
            <path
              key={`slice-${label}-${i}`}
              d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
              fill={fill}
              stroke="#f5f2d0"
              strokeWidth="6"
              style={{ cursor: "pointer" }}
              onClick={() => onSliceClick && onSliceClick(label)}
            />
          );
        })}

        {/* === Slice Text (conditionally rendered based on style) === */}
        {textStyle === 'curved' && labels.map((label, i) => {
          if (radius <= 50) return null; // Don't render text if too small

          const regex = new RegExp(`.{1,${charLimit}}`, 'g');
          const lines = label.length > charLimit ? label.match(regex) : [label];

          return lines.map((line, lineIndex) => {
            const startAngle = (i * 360 / numSlices);
            const endAngle = ((i + 1) * 360 / numSlices);

            const textPathRadius = radius - 15 - (lineIndex * 15);
            if (textPathRadius <= 0) return null; // Avoid invalid radius

            const x1 = center + textPathRadius * Math.cos(startAngle * Math.PI / 180);
            const y1 = center + textPathRadius * Math.sin(startAngle * Math.PI / 180);
            const x2 = center + textPathRadius * Math.cos(endAngle * Math.PI / 180);
            const y2 = center + textPathRadius * Math.sin(endAngle * Math.PI / 180);
            const pathId = `path-${label}-${i}-${lineIndex}`;
            const largeArcFlag = (endAngle - startAngle) <= 180 ? "0" : "1";
            
            const pathData = `M${x1},${y1} A${textPathRadius},${textPathRadius} 0 ${largeArcFlag} 1 ${x2},${y2}`;
            
            const dy = 6;

            return (
              <g key={`text-${label}-${i}-line-${lineIndex}`}>
                <defs>
                  <path id={pathId} d={pathData} />
                </defs>
                <text dy={dy} style={{ pointerEvents: "none" }}>
                  <textPath
                    href={`#${pathId}`}
                    style={{ textAnchor: "middle" }}
                    startOffset="50%"
                    fill="#000"
                    fontSize="12"
                    fontWeight="bold"
                  >
                    {line}
                  </textPath>
                </text>
              </g>
            );
          });
        })}

        {textStyle === 'straight' && labels.map((label, i) => {
          const midAngle = ((i + 0.5) * 360 / numSlices) * Math.PI / 180;
          const textRadius = radius * 0.75;
          const x = center + textRadius * Math.cos(midAngle);
          const y = center + textRadius * Math.sin(midAngle);
          const rotation = (midAngle * 180 / Math.PI);

          return (
            <text
              key={`text-${label}-${i}`}
              x={x}
              y={y}
              fill="#000"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
              transform={`rotate(${rotation}, ${x}, ${y})`}
              style={{ pointerEvents: "none" }}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ====================================================================================
// 1b. White Circle Component (for center)
// This component draws a white circle in the center.
// ====================================================================================
const WhiteCircle = ({ size = 200, className = '' }) => {
  const center = size / 2;
  const radius = size / 2 - 3; // Account for half of the strokeWidth

  return (
    <div className={`white-circle-container ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#f5f2d0"
          stroke="black"
          strokeWidth="6"
        />
      </svg>
    </div>
  );
};

// ====================================================================================
// 2. Main GameBoard Component
// This component defines the data and maps over it to render the circles.
// ====================================================================================
function GameBoard({ onSliceClick }) {
  // ====================================================================================
  //  Rotation function for circle layers
  // ====================================================================================
  const [rotations, setRotations] = useState({
    "circle-1": 0,
    "circle-2": 0,
    "circle-3": 0,
    "circle-4": 0,
    "circle-5": 0,
>>>>>>> 1fe6642197fe9c08526d91a670054317f165532f:frontend/src/components/GameBoard.jsx
  });

<<<<<<< HEAD:frontend/src/GameBoard.jsx
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
=======
  const handleMouseDown = (e, circleId) => {
    // Prevent default text selection behavior
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = getAngle(e.clientX, e.clientY, centerX, centerY);

    dragging.current = {
      active: true,
      circleId,
      startAngle: angle,
      startRotation: rotations[circleId],
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragging.current.active) return;
    
    const circleId = dragging.current.circleId;
    const container = document.querySelector(`.circle-wrapper.${circleId}`);
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = getAngle(e.clientX, e.clientY, centerX, centerY);
    const delta = angle - dragging.current.startAngle;

    setRotations((prev) => ({
      ...prev,
      [circleId]: dragging.current.startRotation + delta,
    }));
  };

  const handleMouseUp = () => {
    dragging.current.active = false;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const getAngle = (x, y, centerX, centerY) => {
    return Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
  };

  // ====================================================================================
  // Data for all circles
  const chartData = [
        {
      id: 'circle-5',
      radius: 525,
      labels: ["Exchange programme", "Vacation", "Learn Finnish / Swedish", "Hobby: Hike", "Hobby: Read", "Hobby: Game", "Hobby: Watch movies", "Hobby: Crafts", "Find a job", "Make a tax card", "Work", "Join a student org.", "Attend (finnish) events", "Attend (intl) events", "Book doctors appointment", "Go to doctors appointment", "Get meds", "Career fairs", "Networking events"],
      colors: ["#da6363", "#da6363", "#ff8989", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a"],
      textStyle: 'curved',
      className: 'outer',
      charLimit: 20
    },
    {
      id: 'circle-4',
      radius: 425,
      labels: ["Get familiar w/ area", "Get insured", "Furnish home", "Get a transport card", "Get a SIM card", "Attend lectures", "Work on assignemtns", "Get a library card", "Update to student register", "Attend orientation", "Get familiar with campus", "Make a study plan", "Register for courses", "Inform MIGRI of your move", "Book police appointment", "Attend Police appointment", "pick up ID", "Book bank appointment", "Attend bank appointment", "Unlock strong ID", "Book DVV appointment", "Attend DVV appointment", "Register address"],
      colors: ["#bb98d5", "#bb98d5", "#bb98d5", "#a872d1", "#e4c1ff", "#5375d0", "#5375d0", "#9fb9ff", "#7e9ef3", "#9fb9ff", "#7e9ef3", "#7892d8", "#7892d8", "#89bd8d", "#89b38d", "#89b38d", "#89b38d", "#659d69", "#659d69", "#659d69", "#89b38d", "#89b38d", "#89b38d"],
      textStyle: 'curved',
      className: 'outer',
      charLimit: 15
    },
    {
      id: 'circle-3',
      radius: 325,
      labels: ["Accept study place", "Kela fee", "Student union fee", "Tuition fee", "Register Attendance on OILI", "Pay activate user / student account", "Submit EHIC / GHIC to KELA", "Attend pre-arrival sessions", "Apply for housing", "Apply for daycare", "Join student communication platform", "Make a Frank account"],
      colors: ["#a3d7ff", "#a0b8ca", "#a0b8ca", "#a0b8ca", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a0b8ca", "#a0b8ca"],
      textStyle: 'curved',
      className: 'outer-middle',
      charLimit: 13
    },
    {
      id: 'circle-2',
      radius: 225,
      labels: ["Documents", "Health Insurance", "Pay Fees", "Documents for family", "Health Insurance for Family", "Pay family fees", "Aquire funds and visa to visit service point", "Visit service point", "Book an appointment /w service point", "Get a D-visa"],
      colors: ["#ffc072", "#ffb088", "#ffc072", "#ffb088", "#d79543", "#d79543", "#d79543", "#e17f4d", "#e17f4d", "#e17f4d"],
      textStyle: 'curved',
      className: 'inner-middle',
      charLimit: 19
    },
    {
      id: 'inner-circle',
      radius: 125,
      // The properties below are not used for the white circle but are kept for consistency
      labels: [""], 
      colors: [""],
      textStyle: '',
      className: 'inner',
      charLimit: 0
>>>>>>> 1fe6642197fe9c08526d91a670054317f165532f:frontend/src/components/GameBoard.jsx
    }
  ];
  
  const largestRadius = Math.max(...chartData.map(c => c.radius));
  const wheelSize = largestRadius * 2;

<<<<<<< HEAD:frontend/src/GameBoard.jsx
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
=======
  return (
    <div className="container">
      <div className="wheel" style={{ position: 'relative', width: wheelSize, height: wheelSize, margin: 'auto' }}>
        {chartData.map((chart) => {
          // Conditionally disable rotation for the innermost circle
          const handleMouseDownForChart = chart.id !== 'inner-circle'
            ? (e) => handleMouseDown(e, chart.id)
            : undefined;
          
          return (
            <div
              key={chart.id}
              className={`circle-wrapper ${chart.id}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: chart.radius * 2,
                height: chart.radius * 2,
                transform: `translate(-50%, -50%) rotate(${rotations[chart.id] || 0}deg)`,
              }}
              onMouseDown={handleMouseDownForChart}
            >
              {chart.id === 'inner-circle' ? (
                // Render the plain white circle for the innermost layer
                <WhiteCircle size={chart.radius * 2} />
              ) : (
                // Render the sliced, colored circle for all other layers
                <Circle
                  radius={chart.radius}
                  labels={chart.labels}
                  colors={chart.colors}
                  onSliceClick={onSliceClick}
                  textStyle={chart.textStyle}
                  className={chart.id}
                  charLimit={chart.charLimit}
                />
              )}
            </div>
          );
        })}
        {/* This div sits on top of all circles in the center */}
        <div className="start-circle" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10 // Ensure it stays on top of other circles
        }}>Start!</div>
      </div>
    </div>
  );
}

export default GameBoard;

>>>>>>> 1fe6642197fe9c08526d91a670054317f165532f:frontend/src/components/GameBoard.jsx
