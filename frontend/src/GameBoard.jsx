import React from "react";
import "./App.css";

function GameBoard({ onSliceClick }) {
  const labels = [
    "Documents",
    "Health Insurance",
    "Pay Fees",
    "Documents for family",
    "Health Insurance for Family",
    "Pay family fees",
    "Aquire funds and visa to visit service point",
    "Visit service point",
    "Book an appointment /w service point",
    "Get a D-visa"
  ];
  const numSlices = labels.length;
  const size = 300;
  const radius = 150;
  const center = 150;

  return (
    <div className="container">
      <div className="wheel">
        <div className="circle-ring outer"></div>
        <div className="circle-ring outer-middle"></div>
        <div className="circle-ring inner-middle"></div>
        <div className="circle-ring inner">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Slice shapes */}
            {labels.map((label, i) => {
              const startAngle = (i * 360 / numSlices) * Math.PI / 180;
              const endAngle = ((i + 1) * 360 / numSlices) * Math.PI / 180;
              const x1 = center + radius * Math.cos(startAngle);
              const y1 = center + radius * Math.sin(startAngle);
              const x2 = center + radius * Math.cos(endAngle);
              const y2 = center + radius * Math.sin(endAngle);
              const fill = i % 2 === 0 ? "#ffcc66" : "#66ccff";
              return (
                <path
                  key={i}
                  d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                  fill={fill}
                  stroke="#f5f2d0"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels.map((label, i) => {
                const midAngle = ((i + 0.5) * 360 / numSlices) * Math.PI / 180; // middle of slice
                const textRadius = radius * 0.6; // distance from center (inside slice)
                const x = center + textRadius * Math.cos(midAngle);
                const y = center + textRadius * Math.sin(midAngle);
                const rotation = (midAngle * 180 / Math.PI); // rotate text to slice angle

                return (
                    <text
                    key={`text-${i}`}
                    x={x}
                    y={y}
                    fill="#000"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${rotation}, ${x}, ${y})`}
                    style={{ pointerEvents: "none" }} // so clicks go to slice
                    >
                    {label}
                    </text>
                );
                })}
          </svg>

          <div className="start-circle">Start!</div>
        </div>
      </div>
    </div>
  );
}

export default GameBoard;
