// src/services/notificationService.js - Complete notification management
import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { supabase } from '../config/supabase';
class NotificationService {
    constructor() {
        this.notificationsCollection = 'notifications';
    }
    /**
     * Send push notification via Supabase Edge Function
     */
    async sendPushNotification({ sectionId, title, message, studentIds }) {
        try {
            console.log('Sending push notification via Supabase client...', {
                sectionId,
                title,
                recipients: studentIds?.length || 'all students'
            });

            const { data, error } = await supabase.functions.invoke('send-push-notification', {
                body: {
                    sectionId,
                    title,
                    message,
                    studentIds
                }
            });

            if (error) {
                throw error;
            }

            console.log("Push notification sent successfully:", data);
            return { success: true, data };
        } catch (err) {
            console.error("Error sending push notification:", err);
            return { success: false, error: err.message };
        }
    }


    // Update the createNotificationForSection method in notificationService.js
    async createNotificationForSection({
        sectionId,
        crId,
        crName,
        title,
        message,
        type,
        relatedId,
        studentIds,
        notifyCR = true // Add option to notify CR too
    }) {
        try {
            console.log('Creating notifications for section:', sectionId);

            const batch = writeBatch(db);
            const notifications = [];

            // Helper function to truncate message to 20 characters
            const truncateMessage = (text, maxLength = 10) => {
                if (!text) return '';
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength).trim() + '...';
            };

            // Truncate the message once
            const truncatedMessage = truncateMessage(message);

            // Create notifications for all students
            for (const studentId of studentIds) {
                const notificationId = doc(collection(db, this.notificationsCollection)).id;
                const notificationData = {
                    id: notificationId,
                    sectionId: sectionId,
                    crId: crId,
                    crName: crName,
                    studentId: studentId,
                    title: title,
                    message: truncatedMessage, // Use truncated message
                    type: type,
                    relatedId: relatedId,
                    isRead: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                const notificationRef = doc(db, this.notificationsCollection, notificationId);
                batch.set(notificationRef, notificationData);
                notifications.push(notificationData);
            }

            // ALSO CREATE NOTIFICATION FOR CR (with different message)
            if (notifyCR) {
                const crNotificationId = doc(collection(db, this.notificationsCollection)).id;
                const crNotificationData = {
                    id: crNotificationId,
                    sectionId: sectionId,
                    crId: crId,
                    crName: crName,
                    studentId: crId, // Use crId as studentId for CR notifications
                    title: `✅ ${title} Created`,
                    message: `${truncatedMessage} - Shared with ${studentIds.length} students`, // Use truncated message for CR too
                    type: `${type}_created`, // Different type for CR notifications
                    relatedId: relatedId,
                    isRead: false,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                const crNotificationRef = doc(db, this.notificationsCollection, crNotificationId);
                batch.set(crNotificationRef, crNotificationData);
                notifications.push(crNotificationData);
            }

            await batch.commit();

            console.log('Notifications created successfully:', notifications.length);
            // 🔥 Also send push notifications via Supabase
            await this.sendPushNotification({
                sectionId,
                title,
                message,
                studentIds
            });
            return { success: true, notifications };

        } catch (error) {
            console.error('Error creating notifications:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }



    // Get notifications for a specific user
    async getNotificationsForUser(userId) {
        try {
            console.log('Loading notifications for user:', userId);

            const q = query(
                collection(db, this.notificationsCollection),
                where('studentId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const notifications = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                notifications.push({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
                });
            });

            console.log('Found notifications:', notifications.length);
            return { success: true, notifications };

        } catch (error) {
            console.error('Error getting notifications:', error);
            return { success: false, error: this.getErrorMessage(error), notifications: [] };
        }
    }

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const notificationRef = doc(db, this.notificationsCollection, notificationId);
            await updateDoc(notificationRef, {
                isRead: true,
                updatedAt: serverTimestamp()
            });

            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Mark all notifications as read for a user
    async markAllAsRead(userId) {
        try {
            const q = query(
                collection(db, this.notificationsCollection),
                where('studentId', '==', userId),
                where('isRead', '==', false)
            );

            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);

            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, {
                    isRead: true,
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            return { success: true };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Real-time listener for notifications
    subscribeToUserNotifications(userId, callback) {
        try {
            const q = query(
                collection(db, this.notificationsCollection),
                where('studentId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const notifications = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    notifications.push({
                        ...data,
                        id: doc.id,
                        createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
                        updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
                    });
                });
                callback({ success: true, notifications });
            }, (error) => {
                console.error('Error in notifications subscription:', error);
                callback({ success: false, error: this.getErrorMessage(error) });
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error setting up notifications subscription:', error);
            return null;
        }
    }

    // Helper method to format error messages
    getErrorMessage(error) {
        console.error('Firebase error details:', error);

        if (error.code) {
            switch (error.code) {
                case 'permission-denied':
                    return 'Permission denied. Please make sure you are logged in and have the right permissions.';
                case 'not-found':
                    return 'The requested data was not found.';
                case 'unavailable':
                    return 'Service is temporarily unavailable. Please try again later.';
                default:
                    return `An error occurred: ${error.message || 'Unknown error'}`;
            }
        }

        return error.message || 'An unexpected error occurred. Please try again.';
    }
}

export default new NotificationService();
