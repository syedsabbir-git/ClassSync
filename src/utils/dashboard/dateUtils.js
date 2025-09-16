// src/utils/dashboard/dateUtils.js
export const formatDate = (date, format = 'short') => {
  if (!date) return 'No date';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Relative time for recent dates
  if (format === 'relative') {
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
  }
  
  const options = format === 'long' 
    ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
    
  return dateObj.toLocaleDateString('en-US', options);
};

export const formatTime = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export const formatDateTime = (date) => {
  return `${formatDate(date, 'short')} at ${formatTime(date)}`;
};

export const isOverdue = (date) => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.getTime() < new Date().getTime();
};

export const isDueToday = (date) => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

export const isDueTomorrow = (date) => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.toDateString() === tomorrow.toDateString();
};

export const getDaysUntilDue = (date) => {
  if (!date) return null;
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getTimeUntilDue = (date) => {
  if (!date) return null;
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffTime = dateObj.getTime() - now.getTime();
  
  if (diffTime < 0) return 'Overdue';
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Due now';
  }
};

export const getUpcomingDeadlines = (activities, days = 7) => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  return activities.filter(activity => {
    const dueDate = new Date(activity.dueDate);
    return dueDate >= now && dueDate <= futureDate;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
};
