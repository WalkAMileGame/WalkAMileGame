import React from "react";
import "./App.css";

function GameBoard({ onSliceClick }) {
    // numbers of buttons
    const FirstLayer = 10
    const SecondLayer = 12
    const ThirdLayer = 23
    const FourthLayer = 19

    const labels1 = [
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

    const labels2 = [
    "Accept study place",
    "Kela fee",
    "Student union fee",
    "Tuition fee",
    "Register Attendance on OILI",
    "Pay activate user / student account",
    "Submit EHIC / GHIC to KELA",
    "Attend pre-arrival sessions",
    "Apply for housing",
    "Apply for daycare",
    "Join student communication platform",
    "Make a Frank account"
  ];

  const labels3 = [
    "Get familiar w/ area",
    "Get insured",
    "Furnish home",
    "Get a transport card",
    "Get a SIM card",
    "Attend lectures",
    "Work on assignemtns",
    "Get a library card",
    "Update to student register",
    "Attend orientation",
    "Get familiar with campus",
    "Make a study plan",
    "Register for courses",
    "Inform MIGRI of your move",
    "Book police appointment",
    "Attend Police appointment",
    "pick up ID",
    "Book bank appointment",
    "Attend bank appointment",
    "Unlock strong ID",
    "Book DVV appointment",
    "Attend DVV appointment",
    "Register address",
  ];

  const labels4 = [
    "Exchange programme",
    "Vacation",
    "Learn Finnish / Swedish",
    "Hobby: Hike",
    "Hobby: Read",
    "Hobby: Game",
    "Hobby: Watch movies",
    "Hobby: Crafts",
    "Find a job",
    "Make a tax card",
    "Work",
    "Join a student org.",
    "Attend (finnish) events",
    "Attend (intl) events",
    "Book doctors appointment",
    "Go to doctors appointment",
    "Get meds",
    "Career fairs",
    "Networking events",
  ];

  const numSlices1 = labels1.length;
  const numSlices2 = labels2.length;
  const numSlices3 = labels3.length;
  const numSlices4 = labels4.length;
  const size1 = 300;
  const size2 = 550;
  const size3 = 800;
  const size4 = 1000;
  const radius1 = 150;
  const radius2 = 275;
  const radius3 = 400;
  const radius4 = 500;
  const center1 = 150;
  const center2 = 275;
  const center3 = 400;
  const center4 = 500;

  return (
    <div className="container">
      <div className="wheel">
        <div className="circle-ring outer">
          <svg width={size4} height={size4} viewBox={`0 0 ${size4} ${size4}`}>
              {/* Slice shapes */}
              {labels4.map((label, i) => {
                const startAngle = (i * 360 / numSlices4) * Math.PI / 180;
                const endAngle = ((i + 1) * 360 / numSlices4) * Math.PI / 180;
                const x1 = center4 + radius4 * Math.cos(startAngle);
                const y1 = center4 + radius4 * Math.sin(startAngle);
                const x2 = center4 + radius4 * Math.cos(endAngle);
                const y2 = center4 + radius4 * Math.sin(endAngle);
                const fill = i % 2 === 0 ? "#ffcc66" : "#66ccff";
                return (
                  <path
                    key={i}
                    d={`M${center4},${center4} L${x1},${y1} A${radius4},${radius4} 0 0,1 ${x2},${y2} Z`}
                    fill={fill}
                    stroke="#f5f2d0"
                    strokeWidth="6"
                    style={{ cursor: "pointer" }}
                    onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels4.map((label, i) => {
                const midAngle = ((i + 0.5) * 360 / numSlices4) * Math.PI / 180; // middle of slice
                const textRadius = radius4; // distance from center (inside slice)
                const x = center4 + textRadius * Math.cos(midAngle);
                const y = center4 + textRadius * Math.sin(midAngle);
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
        </div>
        <div className="circle-ring outer-middle">
          <svg width={size3} height={size3} viewBox={`0 0 ${size3} ${size3}`}>
              {/* Slice shapes */}
              {labels3.map((label, i) => {
                const startAngle = (i * 360 / numSlices3) * Math.PI / 180;
                const endAngle = ((i + 1) * 360 / numSlices3) * Math.PI / 180;
                const x1 = center3 + radius3 * Math.cos(startAngle);
                const y1 = center3 + radius3 * Math.sin(startAngle);
                const x2 = center3 + radius3 * Math.cos(endAngle);
                const y2 = center3 + radius3 * Math.sin(endAngle);
                const fill = i % 2 === 0 ? "#ffcc66" : "#66ccff";
                return (
                  <path
                    key={i}
                    d={`M${center3},${center3} L${x1},${y1} A${radius3},${radius3} 0 0,1 ${x2},${y2} Z`}
                    fill={fill}
                    stroke="#f5f2d0"
                    strokeWidth="6"
                    style={{ cursor: "pointer" }}
                    onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels3.map((label, i) => {
                const midAngle = ((i + 0.5) * 360 / numSlices3) * Math.PI / 180; // middle of slice
                const textRadius = radius3; // distance from center (inside slice)
                const x = center3 + textRadius * Math.cos(midAngle);
                const y = center3 + textRadius * Math.sin(midAngle);
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
        </div>
        <div className="circle-ring inner-middle">
          <svg width={size2} height={size2} viewBox={`0 0 ${size2} ${size2}`}>
            {/* Slice shapes */}
            {labels2.map((label, i) => {
              const startAngle = (i * 360 / numSlices2) * Math.PI / 180;
              const endAngle = ((i + 1) * 360 / numSlices2) * Math.PI / 180;
              const x1 = center2 + radius2 * Math.cos(startAngle);
              const y1 = center2 + radius2 * Math.sin(startAngle);
              const x2 = center2 + radius2 * Math.cos(endAngle);
              const y2 = center2 + radius2 * Math.sin(endAngle);
              const fill = i % 2 === 0 ? "#ffcc66" : "#66ccff";
              return (
                <path
                  key={i}
                  d={`M${center2},${center2} L${x1},${y1} A${radius2},${radius2} 0 0,1 ${x2},${y2} Z`}
                  fill={fill}
                  stroke="#f5f2d0"
                  strokeWidth="2"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels2.map((label, i) => {
                const midAngle = ((i + 0.5) * 360 / numSlices2) * Math.PI / 180; // middle of slice
                const textRadius = radius2 * 0.6; // distance from center (inside slice)
                const x = center2 + textRadius * Math.cos(midAngle);
                const y = center2 + textRadius * Math.sin(midAngle);
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
        </div>
        <div className="circle-ring inner">
          <svg width={size1} height={size1} viewBox={`0 0 ${size1} ${size1}`}>
            {/* Slice shapes */}
            {labels1.map((label, i) => {
              const startAngle = (i * 360 / numSlices1) * Math.PI / 180;
              const endAngle = ((i + 1) * 360 / numSlices1) * Math.PI / 180;
              const x1 = center1 + radius1 * Math.cos(startAngle);
              const y1 = center1 + radius1 * Math.sin(startAngle);
              const x2 = center1 + radius1 * Math.cos(endAngle);
              const y2 = center1 + radius1 * Math.sin(endAngle);
              const fill = firstlayercolors[i % firstlayercolors.length];
              return (
                <path
                  key={i}
                  d={`M${center1},${center1} L${x1},${y1} A${radius1},${radius1} 0 0,1 ${x2},${y2} Z`}
                  fill={fill}
                  stroke="#f5f2d0"
                  strokeWidth="6"
                  style={{ cursor: "pointer" }}
                  onClick={() => onSliceClick && onSliceClick(label)}
                />
              );
            })}

            {/* Slice text */}
            {labels1.map((label, i) => {
                const midAngle = ((i + 0.5) * 360 / numSlices1) * Math.PI / 180; // middle of slice
                const textRadius = radius1 * 0.6; // distance from center (inside slice)
                const x = center1 + textRadius * Math.cos(midAngle);
                const y = center1 + textRadius * Math.sin(midAngle);
                const rotation = (midAngle * 180 / Math.PI); // rotate text to slice angle

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

  