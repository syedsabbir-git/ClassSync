// src/utils/dashboard/priorityUtils.js - Updated with correct icon names
export const PRIORITY_LEVELS = {
  CRITICAL: { value: 4, label: 'Critical', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
  HIGH: { value: 3, label: 'High', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
  MEDIUM: { value: 2, label: 'Medium', color: 'yellow', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  LOW: { value: 1, label: 'Low', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' }
};

export const ACTIVITY_TYPES = {
  assignment: { label: 'Assignment', icon: 'FileText', color: 'blue' },
  quiz: { label: 'Quiz', icon: 'HelpCircle', color: 'purple' },
  lab: { label: 'Lab Task', icon: 'FlaskConical', color: 'green' },
  presentation: { label: 'Presentation', icon: 'Presentation', color: 'orange' } // Fixed: Changed from Monitor to Presentation
};

// Calculate priority based on deadline and importance
export const calculateActivityPriority = (activity) => {
  const now = new Date();
  const dueDate = new Date(activity.dueDate);
  const timeDiff = dueDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Base priority on activity type
  let basePriority = 2; // MEDIUM
  if (activity.type === 'quiz' || activity.type === 'presentation') {
    basePriority = 3; // HIGH
  } else if (activity.points > 50) {
    basePriority = 3; // HIGH
  }
  
  // Adjust based on time remaining
  if (daysDiff < 0) {
    return PRIORITY_LEVELS.CRITICAL; // Overdue
  } else if (daysDiff === 0) {
    return PRIORITY_LEVELS.CRITICAL; // Due today
  } else if (daysDiff === 1) {
    return Math.max(basePriority, 3) === 4 ? PRIORITY_LEVELS.CRITICAL : PRIORITY_LEVELS.HIGH; // Due tomorrow
  } else if (daysDiff <= 3) {
    return basePriority >= 3 ? PRIORITY_LEVELS.HIGH : PRIORITY_LEVELS.MEDIUM; // Due in 2-3 days
  } else if (daysDiff <= 7) {
    return basePriority >= 3 ? PRIORITY_LEVELS.MEDIUM : PRIORITY_LEVELS.LOW; // Due in a week
  }
  
  return PRIORITY_LEVELS.LOW; // Due later
};

// Sort activities by priority and deadline
export const sortActivitiesByPriority = (activities) => {
  return [...activities].sort((a, b) => {
    const priorityA = calculateActivityPriority(a);
    const priorityB = calculateActivityPriority(b);
    
    // First sort by priority value (higher is more urgent)
    if (priorityA.value !== priorityB.value) {
      return priorityB.value - priorityA.value;
    }
    
    // If same priority, sort by due date (earlier first)
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });
};

// Get next most urgent task
export const getNextUrgentTask = (activities) => {
  const activeActivities = activities.filter(activity => activity.status === 'active');
  const sortedActivities = sortActivitiesByPriority(activeActivities);
  return sortedActivities[0] || null;
};

// Get activities by priority level
export const getActivitiesByPriority = (activities) => {
  const priorityGroups = {
    [PRIORITY_LEVELS.CRITICAL.value]: [],
    [PRIORITY_LEVELS.HIGH.value]: [],
    [PRIORITY_LEVELS.MEDIUM.value]: [],
    [PRIORITY_LEVELS.LOW.value]: []
  };
  
  activities.forEach(activity => {
    const priority = calculateActivityPriority(activity);
    priorityGroups[priority.value].push(activity);
  });
  
  return priorityGroups;
};
