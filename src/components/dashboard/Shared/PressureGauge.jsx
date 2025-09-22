// src/components/dashboard/Shared/PressureIndicator.jsx - Progress bar style
import React from 'react';

const PressureIndicator = ({ pressure }) => {
  const normalizedPressure = Math.max(0, Math.min(4, pressure));
  const percentage = (normalizedPressure / 4) * 100;
  
  const getColor = () => {
    if (normalizedPressure <= 1) return 'bg-green-500';
    if (normalizedPressure <= 2) return 'bg-yellow-500';
    if (normalizedPressure <= 3) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  const getText = () => {
    if (normalizedPressure <= 1) return 'Low';
    if (normalizedPressure <= 2) return 'Moderate';
    if (normalizedPressure <= 3) return 'High';
    return 'Critical';
  };

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div 
          className={`h-4 rounded-full transition-all duration-700 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Pressure Level */}
      {/* <div className="flex justify-between items-center">
        <span className={`text-2xl font-bold ${getColor().replace('bg-', 'text-')}`}>
          {normalizedPressure}
        </span>
        <span className={`text-sm font-medium ${getColor().replace('bg-', 'text-')}`}>
          {getText()}
        </span>
      </div> */}
      
      {/* Scale markers */}
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default PressureIndicator;
