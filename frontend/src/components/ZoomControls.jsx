import React from 'react';

const ZoomControls = ({ zoom, onZoomIn, onZoomOut, minZoom = 0.5, maxZoom = 2 }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      zIndex: 1000,
      userSelect: 'none'
    }}>
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          backgroundColor: 'white',
          cursor: zoom >= maxZoom ? 'not-allowed' : 'pointer',
          fontSize: '20px',
          fontWeight: 'bold',
          color: zoom >= maxZoom ? '#ccc' : '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          padding: 0
        }}
        onMouseEnter={(e) => {
          if (zoom < maxZoom) e.target.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
        }}
      >
        +
      </button>
      
      {/* Divider */}
      <div style={{
        height: '1px',
        backgroundColor: '#e0e0e0',
        width: '100%'
      }} />
      
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          backgroundColor: 'white',
          cursor: zoom <= minZoom ? 'not-allowed' : 'pointer',
          fontSize: '24px',
          fontWeight: 'bold',
          color: zoom <= minZoom ? '#ccc' : '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
          padding: 0
        }}
        onMouseEnter={(e) => {
          if (zoom > minZoom) e.target.style.backgroundColor = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'white';
        }}
      >
        −
      </button>
    </div>
  );
};

export default ZoomControls;
