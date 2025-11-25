import React from 'react';
import '../../styles/CircumstanceView.css';

const CircumstanceView = ({ name, description }) => {
  if (!name) return null;

  return (
    <div className="circumstance-view-container">
      <div className="circumstance-view-header">YOUR CIRCUMSTANCE</div>
      <div className="circumstance-view-name">{name}</div>
      {description && (
        <div className="circumstance-view-description">{description}</div>
      )}
    </div>
  );
};

export default CircumstanceView;
