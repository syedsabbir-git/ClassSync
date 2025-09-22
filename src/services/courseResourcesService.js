// src/services/courseResourcesService.js - Fixed to prevent duplicate resources
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

  // CREATE new course resource
  async createCourseResource({ sectionId, crId, courseCode, courseName, telegramLink = '', whatsappLink = '', blcLink = '', enrollmentKey = '' }) {
    try {
      console.log('Creating course resource:', { sectionId, courseCode });

      // Clean courseCode to ensure consistency
      const cleanCourseCode = courseCode.trim().replace(/\s+/g, '_');
      const resourceId = `${sectionId}_${cleanCourseCode}`;

      // Check if resource already exists
      const existingDoc = await getDoc(doc(db, this.resourcesCollection, resourceId));
      if (existingDoc.exists()) {
        return { success: false, error: 'Course resource already exists. Use update instead.' };
      }

      const resourceData = {
        id: resourceId,
        sectionId: sectionId,
        crId: crId,
        courseCode: courseCode.trim(),
        courseName: courseName.trim(),
        telegramLink: telegramLink.trim() || '',
        whatsappLink: whatsappLink.trim() || '',
        blcLink: blcLink.trim() || '',
        enrollmentKey: enrollmentKey.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      await setDoc(resourceRef, resourceData);

      console.log('Course resource created successfully');
      return { success: true, resource: resourceData };

    } catch (error) {
      console.error('Error creating course resource:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // UPDATE existing course resource
  async updateCourseResource(resourceId, updateData) {
    try {
      console.log('Updating course resource:', resourceId, updateData);

      // Check if resource exists
      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      const existingDoc = await getDoc(resourceRef);
      
      if (!existingDoc.exists()) {
        return { success: false, error: 'Course resource not found' };
      }

      const cleanUpdateData = {
        courseName: updateData.courseName?.trim() || '',
        telegramLink: updateData.telegramLink?.trim() || '',
        whatsappLink: updateData.whatsappLink?.trim() || '',
        blcLink: updateData.blcLink?.trim() || '',
        enrollmentKey: updateData.enrollmentKey?.trim() || '',
        updatedAt: serverTimestamp()
      };

      // Only update fields that are provided
      const fieldsToUpdate = {};
      Object.keys(cleanUpdateData).forEach(key => {
        if (cleanUpdateData[key] !== undefined) {
          fieldsToUpdate[key] = cleanUpdateData[key];
        }
      });

      await updateDoc(resourceRef, fieldsToUpdate);

      console.log('Course resource updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Error updating course resource:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // LEGACY: Update or create course resource (for backward compatibility)
  async updateCourseResources({ sectionId, crId, courseCode, courseName, telegramLink = '', whatsappLink = '', blcLink = '', enrollmentKey = '', resourceId = null }) {
    try {
      console.log('Update/Create course resources:', { sectionId, courseCode, resourceId });

      // If resourceId is provided, it's an update operation
      if (resourceId) {
        return await this.updateCourseResource(resourceId, {
          courseName,
          telegramLink,
          whatsappLink,
          blcLink,
          enrollmentKey
        });
      }

      // Otherwise, it's a create operation
      return await this.createCourseResource({
        sectionId,
        crId,
        courseCode,
        courseName,
        telegramLink,
        whatsappLink,
        blcLink,
        enrollmentKey
      });

    } catch (error) {
      console.error('Error in updateCourseResources:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get course resource by ID
  async getCourseResourceById(resourceId) {
    try {
      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      const resourceDoc = await getDoc(resourceRef);

      if (!resourceDoc.exists()) {
        return { success: false, error: 'Resource not found' };
      }

      const data = resourceDoc.data();
      return {
        success: true,
        resource: {
          ...data,
          id: resourceDoc.id,
          createdAt: data.createdAt?.toDate()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate()?.toISOString() || data.updatedAt
        }
      };

    } catch (error) {
      console.error('Error getting course resource by ID:', error);
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
      console.log('Deleting course resource:', resourceId);

      const resourceRef = doc(db, this.resourcesCollection, resourceId);
      
      // Check if resource exists before deleting
      const existingDoc = await getDoc(resourceRef);
      if (!existingDoc.exists()) {
        return { success: false, error: 'Resource not found' };
      }

      await deleteDoc(resourceRef);

      console.log('Course resource deleted successfully');
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
