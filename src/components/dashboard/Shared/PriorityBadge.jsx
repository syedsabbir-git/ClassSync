// src/components/dashboard/Shared/PriorityBadge.jsx
import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Circle } from 'lucide-react';

const PriorityBadge = ({ priority, showIcon = true, size = 'sm' }) => {
  const priorityConfig = {
    4: { 
      label: 'Critical', 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-200',
      icon: AlertTriangle 
    },
    3: { 
      label: 'High', 
      bg: 'bg-orange-100', 
      text: 'text-orange-800', 
      border: 'border-orange-200',
      icon: Clock 
    },
    2: { 
      label: 'Medium', 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      border: 'border-yellow-200',
      icon: Circle 
    },
    1: { 
      label: 'Low', 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      border: 'border-green-200',
      icon: CheckCircle 
    }
  };

  const config = priorityConfig[priority?.value || 1];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-3 w-3', 
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span className={`inline-flex items-center space-x-1 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{priority?.label || config.label}</span>
    </span>
  );
};

export default PriorityBadge;
