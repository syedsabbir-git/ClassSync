import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Cookies from 'js-cookie';

class AuthService {
  async signUp({ email, password, name, userType, studentId = null }) {
    try {

      if (!email || !password || !name || !userType) {
        throw new Error('Email, password, name, and user type are required');
      }

      if (!email.endsWith('@diu.edu.bd')) {
        throw new Error('Only DIU email addresses (@diu.edu.bd) are allowed');
      }

      if (!['student', 'cr'].includes(userType)) {
        throw new Error('User type must be either "student" or "cr"');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await firebaseUpdateProfile(user, {
        displayName: name
      });

      const userData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: userType, 
        phone: '',
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(studentId && { studentId: studentId }),
        ...(userType === 'student' && { enrolledSections: [] }),
        ...(userType === 'cr' && { managedSections: [] })
      };

      Object.keys(userData).forEach(key => {
        if (userData[key] === undefined) {
          userData[key] = '';
        }
      });

      await setDoc(doc(db, 'users', user.uid), userData);

      await sendEmailVerification(user);

      await signOut(auth);

      return { 
        success: true, 
        user: userData,
        message: 'Account created successfully! Please check your email to verify your account before signing in.'
      };
    } catch (error) {
      console.error('Error in signUp:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn({ email, password }) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found. Please contact support.');
      }
      
      const userData = userDoc.data();

      if (!userData.emailVerified) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          emailVerified: true,
          updatedAt: serverTimestamp()
        });
        userData.emailVerified = true;
      }

      Cookies.set('userSession', user.uid, { expires: 7 });

      return { success: true, user: userData };
    } catch (error) {
      console.error('Error in signIn:', error);
      return { success: false, error: this.getErrorMessage(error.code) || error.message };
    }
  }

  async updateProfile({ name, phone = '', studentId = '' }) {
    try {
      console.log('Updating user profile:', { name, phone, studentId });
      
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      if (!name || name.trim() === '') {
        throw new Error('Name is required');
      }

      const userId = auth.currentUser.uid;
      
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: name.trim()
      });

      const userRef = doc(db, 'users', userId);
      const updateData = {
        name: name.trim(),
        phone: phone ? phone.trim() : '',
        updatedAt: serverTimestamp()
      };

      if (studentId && studentId.trim()) {
        updateData.studentId = studentId.trim();
      }

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

  async changePassword(currentPassword, newPassword) {
    try {
      console.log('Changing user password');
      
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }

      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      await updatePassword(auth.currentUser, newPassword);
      
      console.log('Password changed successfully');
      return { success: true, message: 'Password changed successfully' };
      
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, error: this.getErrorMessage(error.code) || error.message };
    }
  }

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

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return { success: false, error: this.getErrorMessage(error.code) };
    }
  }

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

  async resendVerificationEmail() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      await sendEmailVerification(user);
      return { success: true, message: 'Verification email sent! Please check your inbox.' };
    } catch (error) {
      console.error('Error resending verification email:', error);
      return { success: false, error: error.message };
    }
  }

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