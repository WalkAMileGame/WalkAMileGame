import React, { useState, useEffect } from 'react';
import '../../styles/CircumstanceView.css';

const CircumstanceView = ({ name, description, isMinimized, onToggle }) => {
  const [shouldRenderContent, setShouldRenderContent] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isMinimized) {
      // Start minimizing animation
      setIsAnimating(true);
      // Remove content from DOM after animation completes (800ms)
      const timer = setTimeout(() => {
        setShouldRenderContent(false);
        setIsAnimating(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      // Immediately show content when expanding
      setShouldRenderContent(true);
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMinimized]);

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

      {shouldRenderContent && (
        <div className={`circumstance-content ${isMinimized ? 'hiding' : 'showing'}`}>
          <div className="circumstance-view-name">{name}</div>
          {description && (
            <div className="circumstance-view-description">{description}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CircumstanceView;
