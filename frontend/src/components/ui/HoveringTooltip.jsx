import React, { useState } from 'react';

export default function HoverTooltipDemo() {
  const [hoverState, setHoverState] = useState('');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Minimal Tooltip Example</h2>

        {/* Minimal tooltip */}
        <div 
          className="relative inline-block"
          onMouseEnter={() => setHoverState('button')}
          onMouseLeave={() => setHoverState('')}
        >
          <button className="px-4 py-2 bg-blue-500 text-white rounded">
            Hover me
          </button>
          {hoverState === 'button' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded">
              Tooltip!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
