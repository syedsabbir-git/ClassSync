// src/hooks/dashboard/useNotifications.js - Custom hook for notifications
import { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Set up real-time listener
    const unsubscribe = notificationService.subscribeToUserNotifications(
      userId,
      (result) => {
        if (result.success) {
          setNotifications(result.notifications);
          setUnreadCount(result.notifications.filter(n => !n.isRead).length);
        } else {
          console.error('Error loading notifications:', result.error);
          setNotifications([]);
          setUnreadCount(0);
        }
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    const result = await notificationService.markAsRead(notificationId);
    return result.success;
  };

  const markAllAsRead = async () => {
    const result = await notificationService.markAllAsRead(userId);
    if (result.success) {
      setUnreadCount(0);
    }
    return result.success;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};
