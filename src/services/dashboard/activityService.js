// src/services/dashboard/activityService.js - Updated with notification support
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
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import sectionService from '../sectionService';
import notificationService from '../notificationService';


class ActivityService {
  constructor() {
    this.activitiesCollection = 'activities';
    this.submissionsCollection = 'submissions';
  }

  // Create new activity (for CRs) - Updated with notification support
  async createActivity(activityData) {
    try {
      console.log('Creating activity with data:', activityData);

      // Validate and safely extract data
      const {
        sectionId,
        crId,
        crName, // Added for notifications
        title,
        description,
        type,
        dueDate,
        submissionType,
        submissionLink,
        submissionLocation,
        status = 'active'
      } = activityData;

      // Validate required fields with proper null checks
      if (!title || !title.trim()) {
        throw new Error('Activity title is required');
      }

      if (!description || !description.trim()) {
        throw new Error('Activity description is required');
      }

      if (!sectionId) {
        throw new Error('Section ID is required');
      }

      if (!crId) {
        throw new Error('CR ID is required');
      }

      if (!dueDate) {
        throw new Error('Due date is required');
      }

      const activityId = doc(collection(db, this.activitiesCollection)).id;

      const processedActivityData = {
        id: activityId,
        sectionId: sectionId,
        crId: crId,
        title: title.trim(),
        description: description.trim(),
        type: type || 'assignment', // 'assignment', 'quiz', 'lab', 'presentation'
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        submissionType: submissionType || 'physical', // 'online' or 'physical'
        submissionLink: submissionType === 'online' && submissionLink ? submissionLink.trim() : null,
        submissionLocation: submissionType === 'physical' && submissionLocation ? submissionLocation.trim() : null,
        status: status, // 'active', 'draft', 'archived'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        submissionCount: 0,
        completedCount: 0
      };

      // Use batch to update both activity and section
      const batch = writeBatch(db);

      // Create activity document
      const activityRef = doc(db, this.activitiesCollection, activityId);
      batch.set(activityRef, processedActivityData);

      // Update section's activity count
      const sectionRef = doc(db, 'sections', sectionId);
      batch.update(sectionRef, {
        activityCount: increment(1),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      console.log('Activity created successfully:', processedActivityData);

      // Create notifications for students (only for active activities)
      if (status === 'active') {
        try {
          // Get section data to retrieve student list
          const sectionResult = await sectionService.getSectionById(sectionId);

          if (sectionResult.success && sectionResult.section?.enrolledStudents?.length > 0) {
            // Format due date for notification
            const dueDateFormatted = new Date(dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Create notification title based on activity type
            const typeLabels = {
              'assignment': 'Assignment',
              'quiz': 'Quiz',
              'lab': 'Lab Report',
              'presentation': 'Presentation'
            };

            const typeLabel = typeLabels[type] || 'Task';

            // In activityService.js, update the notification creation
            await notificationService.createNotificationForSection({
              sectionId: sectionId,
              crId: crId,
              crName: crName || 'Class Representative',
              title: `New ${typeLabel} Assigned`,
              message: `${title.trim()} - Due: ${dueDateFormatted}`,
              type: 'task',
              relatedId: activityId,
              studentIds: sectionResult.section.enrolledStudents,
              notifyCR: true // Add this line
            });


            console.log('Notifications created for new activity');
          }
        } catch (notificationError) {
          // Log notification error but don't fail the activity creation
          console.error('Error creating notifications for activity:', notificationError);
        }
      }

      return { success: true, activity: processedActivityData };
    } catch (error) {
      console.error('Error creating activity:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get activities for a section
  async getActivitiesBySection(sectionId, includeArchived = false) {
    try {
      console.log('Loading activities for section:', sectionId);

      if (!sectionId) {
        console.log('No section ID provided');
        return { success: true, activities: [] };
      }

      let q = query(
        collection(db, this.activitiesCollection),
        where('sectionId', '==', sectionId),
        orderBy('dueDate', 'asc')
      );

      if (!includeArchived) {
        q = query(
          collection(db, this.activitiesCollection),
          where('sectionId', '==', sectionId),
          where('status', '!=', 'archived'),
          orderBy('status'),
          orderBy('dueDate', 'asc')
        );
      }

      const querySnapshot = await getDocs(q);
      const activities = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          ...data,
          id: doc.id,
          dueDate: data.dueDate?.toDate()?.toISOString() || data.dueDate,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        });
      });

      console.log('Found activities:', activities.length);
      return { success: true, activities };
    } catch (error) {
      console.error('Error getting activities:', error);
      return { success: false, error: this.getErrorMessage(error), activities: [] };
    }
  }

  // Real-time listener for activities
  subscribeToActivities(sectionId, callback, includeArchived = false) {
    try {
      if (!sectionId) {
        callback({ success: true, activities: [] });
        return null;
      }

      let q = query(
        collection(db, this.activitiesCollection),
        where('sectionId', '==', sectionId),
        orderBy('dueDate', 'asc')
      );

      if (!includeArchived) {
        q = query(
          collection(db, this.activitiesCollection),
          where('sectionId', '==', sectionId),
          where('status', '!=', 'archived'),
          orderBy('status'),
          orderBy('dueDate', 'asc')
        );
      }

      return onSnapshot(q, (querySnapshot) => {
        const activities = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          activities.push({
            ...data,
            id: doc.id,
            dueDate: data.dueDate?.toDate()?.toISOString() || data.dueDate,
            createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
          });
        });
        callback({ success: true, activities });
      }, (error) => {
        console.error('Error in activities subscription:', error);
        callback({ success: false, error: this.getErrorMessage(error) });
      });
    } catch (error) {
      console.error('Error setting up activities subscription:', error);
      return null;
    }
  }

  // Update activity
  async updateActivity(activityId, updates) {
    try {
      const activityRef = doc(db, this.activitiesCollection, activityId);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      // Safely handle string fields
      if (updates.title !== undefined) {
        updateData.title = (updates.title || '').trim();
      }

      if (updates.description !== undefined) {
        updateData.description = (updates.description || '').trim();
      }

      if (updates.submissionLink !== undefined) {
        updateData.submissionLink = updates.submissionLink ? updates.submissionLink.trim() : null;
      }

      if (updates.submissionLocation !== undefined) {
        updateData.submissionLocation = updates.submissionLocation ? updates.submissionLocation.trim() : null;
      }

      // Convert dueDate if provided
      if (updates.dueDate) {
        updateData.dueDate = Timestamp.fromDate(new Date(updates.dueDate));
      }

      await updateDoc(activityRef, updateData);

      console.log('Activity updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating activity:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Delete activity
  async deleteActivity(activityId, sectionId) {
    try {
      const batch = writeBatch(db);

      // Delete activity document
      const activityRef = doc(db, this.activitiesCollection, activityId);
      batch.delete(activityRef);

      // Update section's activity count
      if (sectionId) {
        const sectionRef = doc(db, 'sections', sectionId);
        batch.update(sectionRef, {
          activityCount: increment(-1),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      console.log('Activity deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting activity:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get activity statistics for dashboard
  async getActivityStats(sectionId) {
    try {
      if (!sectionId) {
        return {
          success: true,
          stats: {
            total: 0,
            active: 0,
            overdue: 0,
            dueToday: 0,
            dueThisWeek: 0,
            byType: { assignment: 0, quiz: 0, lab: 0, presentation: 0 }
          }
        };
      }

      const q = query(
        collection(db, this.activitiesCollection),
        where('sectionId', '==', sectionId),
        where('status', '!=', 'archived')
      );

      const querySnapshot = await getDocs(q);
      const now = new Date();

      let stats = {
        total: 0,
        active: 0,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        byType: {
          assignment: 0,
          quiz: 0,
          lab: 0,
          presentation: 0
        }
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dueDate = data.dueDate?.toDate();

        stats.total++;
        stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;

        if (data.status === 'active') {
          stats.active++;

          if (dueDate) {
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
              stats.overdue++;
            } else if (diffDays === 0) {
              stats.dueToday++;
            } else if (diffDays <= 7) {
              stats.dueThisWeek++;
            }
          }
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting activity stats:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get single activity by ID
  async getActivity(activityId) {
    try {
      const activityRef = doc(db, this.activitiesCollection, activityId);
      const activityDoc = await getDoc(activityRef);

      if (activityDoc.exists()) {
        const data = activityDoc.data();
        const activity = {
          ...data,
          id: activityDoc.id,
          dueDate: data.dueDate?.toDate()?.toISOString() || data.dueDate,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        };
        return { success: true, activity };
      } else {
        return { success: false, error: 'Activity not found' };
      }
    } catch (error) {
      console.error('Error getting activity:', error);
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

export default new ActivityService();
