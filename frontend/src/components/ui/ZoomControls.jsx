import React from 'react';
import '../../styles/ZoomControls.css';

const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset, minZoom = 0.5, maxZoom = 2 }) => {
  return (
    <div className="zoom-controls-container">
      {/* Reset Button */}
      <button
        onClick={onReset}
        className="zoom-button zoom-reset-button"
        aria-label="Reset view"
        title="Reset zoom and pan"
      >
        ⟲
      </button>

      {/* Divider */}
      <div className="zoom-divider" />
      
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        className="zoom-button zoom-in-button"
        aria-label="Zoom in"
      >
        +
      </button>
      
      {/* Divider */}
      <div className="zoom-divider" />
      
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        className="zoom-button zoom-out-button"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
};

export default ZoomControls;
