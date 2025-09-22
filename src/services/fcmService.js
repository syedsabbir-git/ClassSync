import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';

export const requestFCMPermission = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BPqeOD9y81ZlcXiu7SioRpHwFVaQcbXupJ1eTsYB2sHJxcNy6cT1qZwtvVubA0Kzj05_WvO05hHnavE1jxxLVLY'
      });
      console.log('FCM Token obtained:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages (when app is open)
export const setupForegroundListener = (callback) => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show browser notification
    if (payload.notification && Notification.permission === 'granted') {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'classsync-notification'
      });
    }

    // Call callback if provided (for in-app handling)
    if (callback) {
      callback(payload);
    }
  });
};

// Check if FCM is supported
export const isFCMSupported = () => {
  return 'serviceWorker' in navigator && 'Notification' in window;
};
