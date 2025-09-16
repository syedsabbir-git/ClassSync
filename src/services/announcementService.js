// src/services/announcementService.js - Complete announcement management with notifications
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import notificationService from './notificationService';
import sectionService from './sectionService';

class AnnouncementService {
  constructor() {
    this.announcementsCollection = 'announcements';
  }

  // Create new announcement (for CRs)
  async createAnnouncement({ sectionId, crId, title, content, priority = 'medium', crName }) {
    try {
      console.log('Creating announcement:', { sectionId, crId, title, priority });

      // Validate required fields
      if (!title || !title.trim()) {
        throw new Error('Announcement title is required');
      }

      if (!content || !content.trim()) {
        throw new Error('Announcement content is required');
      }

      if (!sectionId) {
        throw new Error('Section ID is required');
      }

      if (!crId) {
        throw new Error('CR ID is required');
      }

      const announcementId = doc(collection(db, this.announcementsCollection)).id;

      const announcementData = {
        id: announcementId,
        sectionId: sectionId,
        crId: crId,
        crName: crName || 'Unknown CR',
        title: title.trim(),
        content: content.trim(),
        priority: priority, // 'low', 'medium', 'high'
        status: 'active', // 'active', 'archived'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        readBy: [] // Array of student IDs who have read this announcement
      };

      // Create the announcement document
      const announcementRef = doc(db, this.announcementsCollection, announcementId);
      await setDoc(announcementRef, announcementData);

      console.log('Announcement created successfully:', announcementData);

      // Create notifications for students
      try {
        // Get section data to retrieve student list
        const sectionResult = await sectionService.getSectionById(sectionId);

        if (sectionResult.success && sectionResult.section?.enrolledStudents?.length > 0) {
          // Get priority label for notification
          const priorityLabels = {
            'high': 'Important',
            'medium': 'New',
            'low': 'New'
          };

          const priorityLabel = priorityLabels[priority] || 'New';

          // In announcementService.js, update the notification creation
          await notificationService.createNotificationForSection({
            sectionId: sectionId,
            crId: crId,
            crName: crName || 'Class Representative',
            title: `${priorityLabel} Announcement`,
            message: title.trim(),
            type: 'announcement',
            relatedId: announcementId,
            studentIds: sectionResult.section.enrolledStudents,
            notifyCR: true // Add this line
          });


          console.log('Notifications created for new announcement');
        }
      } catch (notificationError) {
        // Log notification error but don't fail the announcement creation
        console.error('Error creating notifications for announcement:', notificationError);
      }

      return { success: true, announcement: announcementData };

    } catch (error) {
      console.error('Error creating announcement:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get announcements for a section
  async getAnnouncementsBySection(sectionId, includeArchived = false) {
    try {
      console.log('Loading announcements for section:', sectionId);

      if (!sectionId) {
        console.log('No section ID provided');
        return { success: true, announcements: [] };
      }

      let q = query(
        collection(db, this.announcementsCollection),
        where('sectionId', '==', sectionId),
        orderBy('createdAt', 'desc')
      );

      if (!includeArchived) {
        q = query(
          collection(db, this.announcementsCollection),
          where('sectionId', '==', sectionId),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const announcements = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcements.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        });
      });

      console.log('Found announcements:', announcements.length);
      return { success: true, announcements };

    } catch (error) {
      console.error('Error getting announcements:', error);
      return { success: false, error: this.getErrorMessage(error), announcements: [] };
    }
  }

  // Update announcement
  async updateAnnouncement(announcementId, updates) {
    try {
      console.log('Updating announcement:', announcementId, updates);

      const announcementRef = doc(db, this.announcementsCollection, announcementId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Safely handle string fields
      if (updates.title !== undefined) {
        updateData.title = (updates.title || '').trim();
      }

      if (updates.content !== undefined) {
        updateData.content = (updates.content || '').trim();
      }

      await updateDoc(announcementRef, updateData);

      console.log('Announcement updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Error updating announcement:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Delete announcement
  async deleteAnnouncement(announcementId) {
    try {
      console.log('Deleting announcement:', announcementId);

      const announcementRef = doc(db, this.announcementsCollection, announcementId);
      await deleteDoc(announcementRef);

      console.log('Announcement deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error deleting announcement:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Mark announcement as read (for students)
  async markAsRead(announcementId, studentId) {
    try {
      const announcementRef = doc(db, this.announcementsCollection, announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const data = announcementDoc.data();
        const readBy = data.readBy || [];

        if (!readBy.includes(studentId)) {
          await updateDoc(announcementRef, {
            readBy: [...readBy, studentId],
            updatedAt: serverTimestamp()
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get single announcement by ID
  async getAnnouncement(announcementId) {
    try {
      const announcementRef = doc(db, this.announcementsCollection, announcementId);
      const announcementDoc = await getDoc(announcementRef);

      if (announcementDoc.exists()) {
        const data = announcementDoc.data();
        const announcement = {
          ...data,
          id: announcementDoc.id,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        };
        return { success: true, announcement };
      } else {
        return { success: false, error: 'Announcement not found' };
      }
    } catch (error) {
      console.error('Error getting announcement:', error);
      return { success: false, error: this.getErrorMessage(error) };
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
        case 'deadline-exceeded':
          return 'Request timeout. Please check your connection and try again.';
        case 'resource-exhausted':
          return 'Too many requests. Please wait a moment and try again.';
        case 'unauthenticated':
          return 'Authentication required. Please log in again.';
        case 'invalid-argument':
          return 'Invalid request. Please check your input and try again.';
        case 'aborted':
          return 'Operation was aborted. Please try again.';
        default:
          return `An error occurred: ${error.message || 'Unknown error'}`;
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

export default new AnnouncementService();
