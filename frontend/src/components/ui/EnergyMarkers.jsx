// EnergyMarkers.jsx
import React from 'react';
import '../../styles/EnergyMarkers.css';
import energy1 from '../../assets/energy01.png';
import energy2 from '../../assets/energy02.png';
import energy3 from '../../assets/energy03.png';
import energy4 from '../../assets/energy04.png';
import energyEmpty from '../../assets/energyEmpty.png';

const EnergyMarkers = ({
  gameConfig,
  rotations,
  activeMarkers,
  centerX = 800,
  centerY = 800
}) => {
  // Select the appropriate energy icon based on energy value
  const getEnergyIcon = (energyValue) => {
    if (energyValue == 1) return energy1;
    if (energyValue == 2) return energy2;
    if (energyValue == 3) return energy3;
    if (energyValue == 4) return energy4;
    return energyEmpty; // For energyValue != 1-4
  };

  // Check if we need to show a number overlay
  const needsNumberOverlay = (energyValue) => {
    return energyValue < 1 || energyValue > 4;
  };

  // Calculate where to place the marker on a tile (WITHOUT rotation)
  const getMarkerPosition = (ring, labelIndex) => {
    // Compute cumulative angles l
    const totalAngleUnits = ring.labels.reduce(
      (acc, l) => acc + (l.tileType === "ring_title" ? 2 : 1),
      0
    );
    const baseAnglePerUnit = 360 / totalAngleUnits;

    let cumulativeAngle = 0;
    for (let i = 0; i <= labelIndex; i++) {
      const l = ring.labels[i];
      const sliceAngle = l.tileType === "ring_title" ? baseAnglePerUnit * 2 : baseAnglePerUnit;
      if (i === labelIndex) {
        const midAngleDeg = cumulativeAngle + sliceAngle / 2;
        const midAngle = (midAngleDeg - 90) * (Math.PI / 180);
        const midRadius = (ring.innerRadius + ring.outerRadius) / 2;
        const x = centerX + midRadius * Math.cos(midAngle);
        const y = centerY + midRadius * Math.sin(midAngle);
        return { x, y, midAngleDeg };
      }
      cumulativeAngle += sliceAngle;
    }
  };

  return (
    <>
      {gameConfig?.ringData?.map((ring) => {
        const rotation = rotations[ring.id] || 0;
        
        return ring.labels.map((label, index) => {
          const compositeKey = `${ring.id}-${label.id}`;
          if (!activeMarkers.has(compositeKey)) return null;

          const { x, y, midAngleDeg } = getMarkerPosition(ring, index);
          
          return (
            <g 
              key={`marker-${compositeKey}`}
              transform={`rotate(${rotation} ${centerX} ${centerY})`}
              style={{ pointerEvents: 'none' }}
            >
            <g transform={`rotate(${midAngleDeg} ${x} ${y})`}>
              <image
                data-testid={`energy-marker-${label.id}`}
                href={getEnergyIcon(label.energyvalue)}
                x={x - 30}
                y={y - 30}
                width="60"
                height="60"
              />
              {needsNumberOverlay(label.energyvalue) && (
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fontFamily="'Lilita One', cursive"
                  fontSize="28"
                  fontWeight="bold"
                  fill="#d5b14e"
                >
                  {label.energyvalue}
                </text>
              )}
            </g>
          </g>
          );
        });
      })}
    </>
  );
};

export default EnergyMarkers;
