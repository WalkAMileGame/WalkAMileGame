// EnergyMarkers.jsx
import React from 'react';
import '../styles/EnergyMarkers.css';
import energyIcon from '../assets/WAM_Element_4.png';

const EnergyMarkers = ({ 
  gameConfig, 
  rotations, 
  activeMarkers,
  centerX = 800, 
  centerY = 800
}) => {
  // Calculate where to place the marker on a tile (WITHOUT rotation)
  const getMarkerPosition = (ring, labelIndex) => {
    const numSlices = ring.labels.length;
    const anglePerSlice = 360 / numSlices;
    
    // Calculate the center angle of the slice (without rotation applied)
    const midAngleDeg = (labelIndex + 0.5) * anglePerSlice;
    const midAngle = (midAngleDeg - 90) * Math.PI / 180;
    
    // Place marker at the center of the ring
    const midRadius = (ring.innerRadius + ring.outerRadius) / 2;
    
    return {
      x: centerX + midRadius * Math.cos(midAngle),
      y: centerY + midRadius * Math.sin(midAngle),
      midAngleDeg
    };
  };

  return (
    <>
      {gameConfig.ringData.map((ring) => {
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
              href={energyIcon}
              x={x - 60}
              y={y - 60}
              width="120"
              height="120"
            />
          </g>
          </g>
          );
        });
      })}
    </>
  );
};

export default EnergyMarkers;
