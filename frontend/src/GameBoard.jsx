import React from "react";
import "./App.css";

function GameBoard({ onSliceClick }) {
    // numbers of buttons
    const FirstLayer = 10
    const SecondLayer = 12
    const ThirdLayer = 23
    const FourthLayer = 19

    //first layer
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
    const firstlayercolors = [
      "#ffc072",
      "#ffb088",
      "#ffc072",
      "#ffb088",
      "#d79543",
      "#d79543",
      "#d79543",
      "#e17f4d",
      "#e17f4d",
      "#e17f4d"
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
              const fill = firstlayercolors[i % firstlayercolors.length];
              return (
                <path
                  key={i}
                  d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                  fill={fill}
                  stroke="#f5f2d0"
                  strokeWidth="6"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels.map((label, i) => {
              const midAngle = ((i + 0.5) * 360 / numSlices) * Math.PI / 180; // middle of slice
              const textRadius = radius * 0.85; // closer to outer edge (pizzacrust)
              const x = center + textRadius * Math.cos(midAngle);
              const y = center + textRadius * Math.sin(midAngle);

              return (
                  <text
                    key={`text-${i}`}
                    x={x}
                    y={y}
                    fill="#000"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor={midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? "end" : "start"} 
                    alignmentBaseline="middle"
                    style={{ pointerEvents: "none" }}
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

  