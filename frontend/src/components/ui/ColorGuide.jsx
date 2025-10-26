import React from 'react';
import '../../styles/ColorGuide.css';

const ColorGuide = () => {
  return (
    <div className="color-guide-container">
      <div className="color-guide-row">
        <div className="color-box split-box">
          <div className="color-half orange"></div>
          <div className="color-half light-blue"></div>
        </div>
        <span className="color-text">MOVING</span>
      </div>

      <div className="color-guide-row">
        <div className="color-box split-box">
          <div className="color-half blue"></div>
          <div className="color-half light-purple"></div>
        </div>
        <span className="color-text">ARRIVING</span>
      </div>

      <div className="color-guide-row">
        <div className="color-box single-color red"></div>
        <span className="color-text">THRIVING</span>
      </div>
    </div>
  );
};

export default ColorGuide;
