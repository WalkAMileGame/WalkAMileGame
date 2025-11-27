import React from 'react';
import '../../styles/CircumstanceView.css';

const CircumstanceView = ({ name, description, isMinimized, onToggle }) => {
  if (!name) return null;

  return (
    <div className={`circumstance-view-container ${isMinimized ? 'minimized' : ''}`}>
      <div className="circumstance-view-header-wrapper">
        {!isMinimized && <div className="circumstance-view-header">YOUR CIRCUMSTANCE</div>}
        <button
          className="circumstance-toggle-btn"
          onClick={onToggle}
          aria-label={isMinimized ? "Expand circumstance" : "Minimize circumstance"}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          <div className="circumstance-view-name">{name}</div>
          {description && (
            <div className="circumstance-view-description">{description}</div>
          )}
        </>
      )}
    </div>
  );
};

export default CircumstanceView;
