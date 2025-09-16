// src/components/dashboard/Shared/NotificationBadge.jsx
import React from 'react';

const NotificationBadge = ({ count, type = 'notification', className = '', size = 'sm' }) => {
  if (!count || count === 0) return null;

  const sizeClasses = {
    xs: 'h-4 w-4 text-xs',
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base'
  };

  const typeClasses = {
    notification: 'bg-red-500 text-white',
    pending: 'bg-orange-500 text-white', 
    manage: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white'
  };

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <span className={`inline-flex items-center justify-center ${sizeClasses[size]} ${typeClasses[type]} font-semibold rounded-full ${className}`}>
      {displayCount}
    </span>
  );
};

export default NotificationBadge;
