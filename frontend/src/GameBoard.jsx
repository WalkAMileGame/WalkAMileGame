import React from "react";
import "./App.css";

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

          // Splits long labels into multiple lines for curved paths
          const regex = new RegExp(`.{1,${charLimit}}`, 'g');
          const lines = label.length > charLimit ? label.match(regex) : [label];

          return lines.map((line, lineIndex) => {
            const startAngle = (i * 360 / numSlices);
            const endAngle = ((i + 1) * 360 / numSlices);
            const midAngle = startAngle + (endAngle - startAngle) / 2;

            // Each line needs its own radius, stacked inside the other
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
                    xlinkHref={`#${pathId}`}
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
          const textRadius = radius * 0.75; // Adjust position from center
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
// 2. Main GameBoard Component
// This component defines the data and maps over it to render the circles.
// ====================================================================================
function GameBoard({ onSliceClick }) {
  // Data for all circles
  const chartData = [
    {
      id: 'circle-4',
      radius: 500,
      labels: ["Exchange programme", "Vacation", "Learn Finnish / Swedish", "Hobby: Hike", "Hobby: Read", "Hobby: Game", "Hobby: Watch movies", "Hobby: Crafts", "Find a job", "Make a tax card", "Work", "Join a student org.", "Attend (finnish) events", "Attend (intl) events", "Book doctors appointment", "Go to doctors appointment", "Get meds", "Career fairs", "Networking events"],
      colors: ["#da6363", "#da6363", "#ff8989", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a", "#da8a8a", "#da6363", "#da6363", "#da6363", "#da8a8a", "#da8a8a"],
      textStyle: 'curved',
      className: 'outer',
      charLimit: 20
    },
    {
      id: 'circle-3',
      radius: 400,
      labels: ["Get familiar w/ area", "Get insured", "Furnish home", "Get a transport card", "Get a SIM card", "Attend lectures", "Work on assignemtns", "Get a library card", "Update to student register", "Attend orientation", "Get familiar with campus", "Make a study plan", "Register for courses", "Inform MIGRI of your move", "Book police appointment", "Attend Police appointment", "pick up ID", "Book bank appointment", "Attend bank appointment", "Unlock strong ID", "Book DVV appointment", "Attend DVV appointment", "Register address"],
      colors: ["#bb98d5", "#bb98d5", "#bb98d5", "#a872d1", "#e4c1ff", "#5375d0", "#5375d0", "#9fb9ff", "#7e9ef3", "#9fb9ff", "#7e9ef3", "#7892d8", "#7892d8", "#89bd8d", "#89b38d", "#89b38d", "#89b38d", "#659d69", "#659d69", "#659d69", "#89b38d", "#89b38d", "#89b38d"],
      textStyle: 'curved',
      className: 'outer-middle',
      charLimit: 13
    },
    {
      id: 'circle-2',
      radius: 275,
      labels: ["Accept study place", "Kela fee", "Student union fee", "Tuition fee", "Register Attendance on OILI", "Pay activate user / student account", "Submit EHIC / GHIC to KELA", "Attend pre-arrival sessions", "Apply for housing", "Apply for daycare", "Join student communication platform", "Make a Frank account"],
      colors: ["#a3d7ff", "#a0b8ca", "#a0b8ca", "#a0b8ca", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a3d7ff", "#d3eafc", "#a0b8ca", "#a0b8ca"],
      textStyle: 'curved',
      className: 'inner-middle',
      charLimit: 19
    },
    {
      id: 'circle-1',
      radius: 150,
      labels: ["Documents", "Health Insurance", "Pay Fees", "Documents for family", "Health Insurance for Family", "Pay family fees", "Aquire funds and visa to visit service point", "Visit service point", "Book an appointment /w service point", "Get a D-visa"],
      colors: ["#ffc072", "#ffb088", "#ffc072", "#ffb088", "#d79543", "#d79543", "#d79543", "#e17f4d", "#e17f4d", "#e17f4d"],
      textStyle: 'curved',
      className: 'inner',
      charLimit: 9
    }
  ];

  return (
    <div className="container">
      <div className="wheel">
        {chartData.map(chart => (
          <Circle
            key={chart.id}
            radius={chart.radius}
            labels={chart.labels}
            colors={chart.colors}
            onSliceClick={onSliceClick}
            textStyle={chart.textStyle}
            className={chart.className}
            charLimit={chart.charLimit}
          />
        ))}
        <div className="start-circle">Start!</div>
      </div>
    </div>
  );
}

export default GameBoard;
