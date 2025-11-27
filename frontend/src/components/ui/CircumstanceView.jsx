import React from 'react';
import '../../styles/CircumstanceView.css';

const CircumstanceView = ({ name, description, isMinimized, onToggle }) => {
  if (!name) return null;

  return (
    <div className={`circumstance-view-container ${isMinimized ? 'minimized' : 'expanded'}`}>
      <div className="circumstance-view-header-wrapper">
        <div className="circumstance-view-header">YOUR CIRCUMSTANCE</div>
        <button
          className="circumstance-toggle-btn"
          onClick={onToggle}
          aria-label={isMinimized ? "Expand circumstance" : "Minimize circumstance"}
        >
          {isMinimized ? '□' : '−'}
        </button>
      </div>

      <div className={`circumstance-content ${isMinimized ? 'hidden' : ''}`}>
        <div className="circumstance-view-name">{name}</div>
        {description && (
          <div className="circumstance-view-description">{description}</div>
        )}
      </div>
    </div>
  );
};

export default CircumstanceView;
