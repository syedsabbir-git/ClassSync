// src/services/sectionService.js - Updated with missing getSectionById method
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateSectionKey } from '../utils/helpers';
import { supabase } from '../config/supabase';

class SectionService {
  // Create new section (for CRs)
  async createSection({ crId, departmentName, batchNumber, crName }) {
    try {
      const sectionKey = generateSectionKey();
      const sectionId = `${departmentName.replace(/\s+/g, '_')}_${batchNumber.replace(/\s+/g, '_')}_${sectionKey}`;

      const sectionData = {
        id: sectionId,
        sectionKey: sectionKey,
        departmentName: departmentName,
        batchNumber: batchNumber,
        crId: crId,
        crName: crName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        studentCount: 0,
        enrolledStudents: [],
        activityCount: 0
      };

      // Use batch write for consistency
      const batch = writeBatch(db);

      // Create section document
      const sectionRef = doc(db, 'sections', sectionId);
      batch.set(sectionRef, sectionData);

      // Update CR's managed sections
      const userRef = doc(db, 'users', crId);
      batch.update(userRef, {
        managedSections: arrayUnion(sectionId),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      console.log('Section created successfully:', sectionData);
      return { success: true, sectionKey, sectionData };
    } catch (error) {
      console.error('Error creating section:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get single section by ID - MISSING METHOD ADDED
  async getSectionById(sectionId) {
    try {
      console.log('Getting section by ID:', sectionId);

      if (!sectionId) {
        return { success: false, error: 'Section ID is required' };
      }

      const sectionRef = doc(db, 'sections', sectionId);
      const sectionDoc = await getDoc(sectionRef);

      if (!sectionDoc.exists()) {
        console.log('Section not found:', sectionId);
        return { success: false, error: 'Section not found' };
      }

      const sectionData = {
        ...sectionDoc.data(),
        id: sectionDoc.id
      };

      // Convert timestamps if they exist
      if (sectionData.createdAt && typeof sectionData.createdAt.toDate === 'function') {
        sectionData.createdAt = sectionData.createdAt.toDate().toISOString();
      }
      if (sectionData.updatedAt && typeof sectionData.updatedAt.toDate === 'function') {
        sectionData.updatedAt = sectionData.updatedAt.toDate().toISOString();
      }

      console.log('Section found:', sectionData);
      return { success: true, section: sectionData };

    } catch (error) {
      console.error('Error getting section by ID:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Delete entire section (for CRs only) - Cascading delete
  async deleteSection(sectionId, crId) {
    try {
      console.log('Deleting section and all related data:', { sectionId, crId });

      // Use transaction for atomic deletion
      const result = await runTransaction(db, async (transaction) => {
        const sectionRef = doc(db, 'sections', sectionId);

        // Verify section exists and user is the CR
        const sectionSnapshot = await transaction.get(sectionRef);
        if (!sectionSnapshot.exists()) {
          throw new Error('Section not found');
        }

        const sectionData = sectionSnapshot.data();
        if (sectionData.crId !== crId) {
          throw new Error('Only the CR can delete this section');
        }

        // 1. Delete all enrollments for this section
        const enrollmentsRef = collection(db, 'enrollments');
        const enrollmentQuery = query(enrollmentsRef, where('sectionId', '==', sectionId));
        const enrollmentSnapshot = await getDocs(enrollmentQuery);

        enrollmentSnapshot.forEach((enrollmentDoc) => {
          transaction.delete(enrollmentDoc.ref);
        });

        // 2. Delete all activities for this section
        const activitiesRef = collection(db, 'activities');
        const activityQuery = query(activitiesRef, where('sectionId', '==', sectionId));
        const activitySnapshot = await getDocs(activityQuery);

        activitySnapshot.forEach((activityDoc) => {
          transaction.delete(activityDoc.ref);
        });

        // 3. Update all enrolled students (remove section from their enrolledSections)
        const enrolledStudents = sectionData.enrolledStudents || [];
        for (const studentId of enrolledStudents) {
          const userRef = doc(db, 'users', studentId);
          transaction.update(userRef, {
            enrolledSections: arrayRemove(sectionId),
            updatedAt: serverTimestamp()
          });
        }

        // 4. Update CR (remove section from managedSections)
        const crRef = doc(db, 'users', crId);
        transaction.update(crRef, {
          managedSections: arrayRemove(sectionId),
          updatedAt: serverTimestamp()
        });

        // 5. Finally, delete the section document
        transaction.delete(sectionRef);

        return {
          deletedEnrollments: enrollmentSnapshot.size,
          deletedActivities: activitySnapshot.size,
          updatedStudents: enrolledStudents.length
        };
      });

      console.log('Section deleted successfully:', result);

      // NEW: Delete all section FCM tokens via Edge Function
      const { data, error } = await supabase.functions.invoke('delete-fcm-token', {
        body: {
          sectionId: sectionId,
          deleteAll: true
        }
      });

      if (error) {
        console.error('Error deleting section tokens via Edge Function:', error);
      } else {
        console.log(`All FCM tokens for section ${sectionId} deleted via Edge Function:`, data);
      }


      return {
        success: true,
        message: `Section deleted successfully. Removed ${result.deletedActivities} activities and ${result.deletedEnrollments} enrollments.`
      };

    } catch (error) {
      console.error('Error deleting section:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Enroll student in section (for Students) - Using Transaction for Atomicity
  async enrollInSection({ studentId, sectionKey, studentName, fcmToken = null }) {
    try {
      console.log('Starting enrollment process for:', { studentId, sectionKey, studentName });

      // First, find the section by key
      const sectionsRef = collection(db, 'sections');
      const q = query(sectionsRef, where('sectionKey', '==', sectionKey.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No section found with key:', sectionKey);
        return { success: false, error: 'Invalid section key. Please check the key and try again.' };
      }

      const sectionDoc = querySnapshot.docs[0];
      const sectionData = sectionDoc.data();
      const sectionId = sectionDoc.id;

      console.log('Found section:', sectionData);

      // Check if student is already enrolled
      if (sectionData.enrolledStudents && sectionData.enrolledStudents.includes(studentId)) {
        return { success: false, error: 'You are already enrolled in this section.' };
      }

      // Use transaction for atomic enrollment
      const result = await runTransaction(db, async (transaction) => {
        const sectionRef = doc(db, 'sections', sectionId);
        const userRef = doc(db, 'users', studentId);
        const enrollmentRef = doc(db, 'enrollments', `${studentId}_${sectionId}`);

        // Read current section data
        const sectionSnapshot = await transaction.get(sectionRef);
        if (!sectionSnapshot.exists()) {
          throw new Error('Section not found');
        }

        const currentSectionData = sectionSnapshot.data();

        // Check again if student is already enrolled (double-check in transaction)
        if (currentSectionData.enrolledStudents && currentSectionData.enrolledStudents.includes(studentId)) {
          throw new Error('Already enrolled');
        }

        // Read current user data
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists()) {
          throw new Error('User not found');
        }

        const currentUserData = userSnapshot.data();

        // Update section document
        transaction.update(sectionRef, {
          enrolledStudents: arrayUnion(studentId),
          studentCount: (currentSectionData.studentCount || 0) + 1,
          updatedAt: serverTimestamp()
        });

        // Update user document
        const currentEnrolledSections = currentUserData.enrolledSections || [];
        transaction.update(userRef, {
          enrolledSections: arrayUnion(sectionId),
          updatedAt: serverTimestamp()
        });

        // Create enrollment record
        const enrollmentData = {
          studentId: studentId,
          studentName: studentName,
          sectionId: sectionId,
          sectionKey: sectionKey.toUpperCase(),
          enrolledAt: new Date().toISOString()
        };

        transaction.set(enrollmentRef, enrollmentData);

        return { ...currentSectionData, id: sectionId };
      });

      console.log('Enrollment completed successfully');

      // --- NEW: Save FCM token to Supabase ---
      if (fcmToken) {
        const { data, error } = await supabase.functions.invoke('store-fcm-token', {
          body: {
            userId: studentId,
            sectionId: sectionId,
            token: fcmToken
          }
        });

        if (error) {
          console.error('Error storing FCM token:', error);
        } else {
          console.log('FCM token stored successfully via Edge Function');
        }
      }

      return { success: true, sectionData: result };

    } catch (error) {
      console.error('Error enrolling in section:', error);

      if (error.message === 'Already enrolled') {
        return { success: false, error: 'You are already enrolled in this section.' };
      }

      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get CR's sections
  async getCRSections(crId) {
    try {
      console.log('Loading sections for CR:', crId);

      const sectionsRef = collection(db, 'sections');
      const q = query(sectionsRef, where('crId', '==', crId));
      const querySnapshot = await getDocs(q);

      const sections = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sections.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        });
      });

      console.log('Found sections for CR:', sections);
      return { success: true, sections };
    } catch (error) {
      console.error('Error getting CR sections:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get student's sections
  async getStudentSections(studentId) {
    try {
      console.log('Loading sections for student:', studentId);

      // Get user document to find enrolled sections
      const userDoc = await getDoc(doc(db, 'users', studentId));

      if (!userDoc.exists()) {
        console.log('User document not found:', studentId);
        return { success: true, sections: [] };
      }

      const userData = userDoc.data();

      if (!userData.enrolledSections || userData.enrolledSections.length === 0) {
        console.log('No enrolled sections found for student');
        return { success: true, sections: [] };
      }

      // Get all section documents
      const sections = [];
      for (const sectionId of userData.enrolledSections) {
        try {
          const sectionDoc = await getDoc(doc(db, 'sections', sectionId));
          if (sectionDoc.exists()) {
            const data = sectionDoc.data();
            sections.push({
              ...data,
              id: sectionDoc.id,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            });
          } else {
            console.log('Section document not found:', sectionId);
          }
        } catch (sectionError) {
          console.error('Error fetching section:', sectionId, sectionError);
        }
      }

      console.log('Found sections for student:', sections);
      return { success: true, sections };
    } catch (error) {
      console.error('Error getting student sections:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get students enrolled in a specific section
  async getSectionStudents(sectionId) {
    try {
      console.log('Loading students for section:', sectionId);

      // Get the section document to get enrolled student IDs
      const sectionDoc = await getDoc(doc(db, 'sections', sectionId));

      if (!sectionDoc.exists()) {
        console.log('Section not found:', sectionId);
        return { success: false, error: 'Section not found' };
      }

      const sectionData = sectionDoc.data();
      const enrolledStudentIds = sectionData.enrolledStudents || [];

      if (enrolledStudentIds.length === 0) {
        console.log('No students enrolled in section');
        return { success: true, students: [] };
      }

      // Get user documents for all enrolled students
      const students = [];
      for (const studentId of enrolledStudentIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', studentId));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Get enrollment date from enrollment record
            const enrollmentDoc = await getDoc(doc(db, 'enrollments', `${studentId}_${sectionId}`));
            const enrolledAt = enrollmentDoc.exists() ? enrollmentDoc.data().enrolledAt : null;

            students.push({
              uid: studentId,
              name: userData.name || 'Unknown',
              email: userData.email || '',
              phone: userData.phone || '',
              studentId: userData.studentId || '',
              enrolledAt: enrolledAt
            });
          } else {
            console.log('User document not found for student:', studentId);
          }
        } catch (userError) {
          console.error('Error fetching user data for student:', studentId, userError);
        }
      }

      console.log('Found students for section:', students);
      return { success: true, students };
    } catch (error) {
      console.error('Error getting section students:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Unenroll a student from a section
  async unenrollStudent(sectionId, studentId) {
    try {
      console.log('Unenrolling student:', { sectionId, studentId });

      // Use transaction for atomic unenrollment
      const result = await runTransaction(db, async (transaction) => {
        const sectionRef = doc(db, 'sections', sectionId);
        const userRef = doc(db, 'users', studentId);
        const enrollmentRef = doc(db, 'enrollments', `${studentId}_${sectionId}`);

        // Read current section data
        const sectionSnapshot = await transaction.get(sectionRef);
        if (!sectionSnapshot.exists()) {
          throw new Error('Section not found');
        }

        const currentSectionData = sectionSnapshot.data();

        // Check if student is actually enrolled
        if (!currentSectionData.enrolledStudents || !currentSectionData.enrolledStudents.includes(studentId)) {
          throw new Error('Student not enrolled in this section');
        }

        // Read current user data
        const userSnapshot = await transaction.get(userRef);
        if (!userSnapshot.exists()) {
          throw new Error('User not found');
        }

        // Update section document (remove student from enrolled list and decrease count)
        transaction.update(sectionRef, {
          enrolledStudents: arrayRemove(studentId),
          studentCount: Math.max(0, (currentSectionData.studentCount || 1) - 1),
          updatedAt: serverTimestamp()
        });

        // Update user document (remove section from enrolled sections)
        transaction.update(userRef, {
          enrolledSections: arrayRemove(sectionId),
          updatedAt: serverTimestamp()
        });

        // Delete enrollment record
        transaction.delete(enrollmentRef);

        return true;
      });

      console.log('Student unenrolled successfully');

      // NEW: Remove FCM tokens via Edge Function
      const { data, error } = await supabase.functions.invoke('delete-fcm-token', {
        body: {
          userId: studentId,
          sectionId: sectionId
        }
      });

      if (error) {
        console.error('Error removing FCM tokens via Edge Function:', error);
      } else {
        console.log('FCM tokens removed successfully via Edge Function:', data);
      }


      return { success: true };

    } catch (error) {
      console.error('Error unenrolling student:', error);

      if (error.message === 'Student not enrolled in this section') {
        return { success: false, error: 'Student is not enrolled in this section.' };
      }

      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Helper method to format error messages
  getErrorMessage(error) {
    console.error('Firebase error details:', error);

    if (error.code) {
      switch (error.code) {
        case 'permission-denied':
          return 'Permission denied. Please make sure you are logged in and try again.';
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

export default new SectionService();
