// EnergyMarkers.jsx
import React from 'react';
import '../styles/EnergyMarkers.css';

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
      y: centerY + midRadius * Math.sin(midAngle)
    };
  };

  return (
    <>
      {gameConfig.ringData.map((ring) => {
        const rotation = rotations[ring.id] || 0;
        
        return ring.labels.map((label, index) => {
          if (!activeMarkers.has(label.id)) return null;

          const pos = getMarkerPosition(ring, index);
          
          return (
            <g 
              key={`marker-${label.id}`}
              transform={`rotate(${rotation} ${centerX} ${centerY})`}
              style={{ pointerEvents: 'none' }}
            >
              {/* Enregy emoji */}
            <text
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="40"
              transform={`rotate(-20, ${pos.x}, ${pos.y})`}
            >
              ⚡
            </text>

            </g>
          );
        });
      })}
    </>
  );
};

export default EnergyMarkers;
