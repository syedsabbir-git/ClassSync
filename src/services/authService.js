// src/services/authService.js - Complete version with all methods
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Cookies from 'js-cookie';

class AuthService {
  // Sign up new user
  async signUp({ email, password, name, userType, studentId = null }) {
    try {
      // Validate required fields
      if (!email || !password || !name || !userType) {
        throw new Error('Email, password, name, and user type are required');
      }

      if (!['student', 'cr'].includes(userType)) {
        throw new Error('User type must be either "student" or "cr"');
      }

      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await firebaseUpdateProfile(user, {
        displayName: name
      });

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: userType, // Make sure this is set properly
        phone: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(studentId && { studentId: studentId }),
        ...(userType === 'student' && { enrolledSections: [] }),
        ...(userType === 'cr' && { managedSections: [] })
      };

      // Ensure no undefined values
      Object.keys(userData).forEach(key => {
        if (userData[key] === undefined) {
          userData[key] = '';
        }
      });

      await setDoc(doc(db, 'users', user.uid), userData);

      // Set cookie for session management
      Cookies.set('userSession', user.uid, { expires: 7 });

      return { success: true, user: userData };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in existing user
  async signIn({ email, password }) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found. Please contact support.');
      }
      
      const userData = userDoc.data();

      // Set cookie for session management
      Cookies.set('userSession', user.uid, { expires: 7 });

      return { success: true, user: userData };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Update user profile - NEW METHOD
  async updateProfile({ name, phone = '', studentId = '' }) {
    try {
      console.log('Updating user profile:', { name, phone, studentId });
      
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      // Validate required fields
      if (!name || name.trim() === '') {
        throw new Error('Name is required');
      }

      const userId = auth.currentUser.uid;
      
      // Update Firebase Auth profile
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: name.trim()
      });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', userId);
      const updateData = {
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        updatedAt: serverTimestamp()
      };

      // Only add studentId if it's provided and not empty
      if (studentId && studentId.trim()) {
        updateData.studentId = studentId.trim();
      }

      // Ensure no undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = '';
        }
      });
      
      await updateDoc(userRef, updateData);
      
      console.log('Profile updated successfully');
      return { success: true, message: 'Profile updated successfully' };
      
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: this.getErrorMessage(error.code) || error.message };
    }
  }

  // Change password - NEW METHOD
  async changePassword(currentPassword, newPassword) {
    try {
      console.log('Changing user password');
      
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      console.log('Password changed successfully');
      return { success: true, message: 'Password changed successfully' };
      
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: this.getErrorMessage(error.code) || error.message };
    }
  }

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      Cookies.remove('userSession');
      return { success: true };
    } catch (error) {
      console.error('Error in signOut:', error);
      return { success: false, error: error.message };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

  // Get current user data
  async getCurrentUserData() {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        return { success: true, user: userDoc.data() };
      }
      return { success: false, error: 'No user logged in' };
    } catch (error) {
      console.error('Error in getCurrentUserData:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to format error messages
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Current password is incorrect.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/requires-recent-login':
        return 'This operation requires recent authentication. Please sign in again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}

export default new AuthService();
