// src/services/courseResourcesService.js - Simplified for 4 resources only
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

class CourseResourcesService {
  constructor() {
    this.resourcesCollection = 'courseResources';
  }

  // Update the updateCourseResources method in courseResourcesService.js
  async updateCourseResources({ sectionId, crId, courseCode, courseName, telegramLink = '', whatsappLink = '', blcLink = '', enrollmentKey = '' }) {
    try {
      console.log('Updating course resources:', { sectionId, courseCode });

      const resourceId = `${sectionId}_${courseCode}`;

      const resourceData = {
        id: resourceId,
        sectionId: sectionId,
        crId: crId,
        courseCode: courseCode,
        courseName: courseName,
        telegramLink: telegramLink || '',
        whatsappLink: whatsappLink || '',
        blcLink: blcLink || '',
        enrollmentKey: enrollmentKey || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      await setDoc(resourceRef, resourceData, { merge: true });

      console.log('Course resources updated successfully');
      return { success: true, resource: resourceData };

    } catch (error) {
      console.error('Error updating course resources:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }


  // Get course resources for a section
  async getCourseResourcesBySection(sectionId) {
    try {
      console.log('Loading course resources for section:', sectionId);

      if (!sectionId) {
        return { success: true, resources: [] };
      }

      const q = query(
        collection(db, this.resourcesCollection),
        where('sectionId', '==', sectionId),
        orderBy('courseCode', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const resources = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        resources.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        });
      });

      console.log('Found course resources:', resources.length);
      return { success: true, resources };

    } catch (error) {
      console.error('Error getting course resources:', error);
      return { success: false, error: this.getErrorMessage(error), resources: [] };
    }
  }

  // Delete course resources
  async deleteCourseResources(resourceId) {
    try {
      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      await deleteDoc(resourceRef);

      console.log('Course resources deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error deleting course resources:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  getErrorMessage(error) {
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

export default new CourseResourcesService();
