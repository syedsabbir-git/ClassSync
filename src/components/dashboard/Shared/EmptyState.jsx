// src/components/dashboard/Shared/EmptyState.jsx
import React from 'react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionButton = null,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {actionButton}
    </div>
  );
};

export default EmptyState;
