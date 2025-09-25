// Simplified EnergyMarkers.jsx
import React from 'react';

const EnergyMarkers = ({ 
  gameConfig, 
  rotations, 
  activeMarkers, // Set of tile IDs that have markers
  centerX = 800, 
  centerY = 800
}) => {
  // Calculate where to place the marker on a tile
  const getMarkerPosition = (ring, labelIndex) => {
    const numSlices = ring.labels.length;
    const anglePerSlice = 360 / numSlices;
    const rotation = rotations[`ring${ring.id}`] || 0;
    
    // Calculate the center angle of the slice
    const startAngle = (labelIndex * anglePerSlice + rotation - 90) * Math.PI / 180;
    const endAngle = ((labelIndex + 1) * anglePerSlice + rotation - 90) * Math.PI / 180;
    const midAngle = (startAngle + endAngle) / 2;
    
    // Place marker at 85% of the radius (closer to outer edge)
    const midRadius = (ring.innerRadius + ring.outerRadius) / 2;
    const markerRadius = midRadius * 0.85;
    
    return {
      x: centerX + markerRadius * Math.cos(midAngle),
      y: centerY + markerRadius * Math.sin(midAngle)
    };
  };

  return (
    <g className="energy-markers" style={{ pointerEvents: 'none' }}>
      {gameConfig.ringData.map((ring) => {
        return ring.labels.map((label, index) => {
          // Only render if this tile has a marker
          if (!activeMarkers.has(label.id)) return null;

          const pos = getMarkerPosition(ring, index);
          
          return (
            <g key={`marker-${label.id}`}>
              {/* Red circle with white border */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill="#ff4444"
                stroke="#ffffff"
                strokeWidth="3"
              />
              {/* Simple lightning bolt icon */}
              <path
                d={`M ${pos.x - 6} ${pos.y - 8} 
                    L ${pos.x + 2} ${pos.y} 
                    L ${pos.x - 2} ${pos.y} 
                    L ${pos.x + 6} ${pos.y + 8} 
                    L ${pos.x - 2} ${pos.y} 
                    L ${pos.x + 2} ${pos.y} Z`}
                fill="#ffffff"
              />
            </g>
          );
        });
      })}
    </g>
  );
};

export default EnergyMarkers;
