// src/hooks/dashboard/useActivities.js
import { useState, useEffect, useCallback } from 'react';
import activityService from '../../services/dashboard/activityService';
import { sortActivitiesByPriority, getNextUrgentTask } from '../../utils/dashboard/priorityUtils';

export const useActivities = (sectionId) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Load activities for a section
  const loadActivities = useCallback(async () => {
    if (!sectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await activityService.getActivitiesBySection(sectionId);
      if (result.success) {
        const sortedActivities = sortActivitiesByPriority(result.activities);
        setActivities(sortedActivities);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  // Load activity statistics
  const loadStats = useCallback(async () => {
    if (!sectionId) return;
    
    try {
      const result = await activityService.getActivityStats(sectionId);
      if (result.success) {
        setStats(result.stats);
      }
    } catch (err) {
      console.error('Error loading activity stats:', err);
    }
  }, [sectionId]);

  // Create new activity
  const createActivity = async (activityData) => {
    try {
      const result = await activityService.createActivity({
        ...activityData,
        sectionId
      });
      
      if (result.success) {
        await loadActivities(); // Refresh activities
        await loadStats(); // Refresh stats
        return { success: true, activity: result.activity };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error creating activity:', err);
      return { success: false, error: 'Failed to create activity' };
    }
  };

  // Update activity
  const updateActivity = async (activityId, updates) => {
    try {
      const result = await activityService.updateActivity(activityId, updates);
      
      if (result.success) {
        await loadActivities(); // Refresh activities
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error updating activity:', err);
      return { success: false, error: 'Failed to update activity' };
    }
  };

  // Delete activity
  const deleteActivity = async (activityId) => {
    try {
      const result = await activityService.deleteActivity(activityId, sectionId);
      
      if (result.success) {
        await loadActivities(); // Refresh activities
        await loadStats(); // Refresh stats
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      return { success: false, error: 'Failed to delete activity' };
    }
  };

  // Get next urgent task
  const getNextTask = useCallback(() => {
    return getNextUrgentTask(activities);
  }, [activities]);

  // Initial load
  useEffect(() => {
    loadActivities();
    loadStats();
  }, [loadActivities, loadStats]);

  return {
    activities,
    loading,
    error,
    stats,
    createActivity,
    updateActivity,
    deleteActivity,
    refreshActivities: loadActivities,
    refreshStats: loadStats,
    getNextTask
  };
};
