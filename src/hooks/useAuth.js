import { useState } from 'react';
import authService from '../services/authService';

export const useAuthActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signUp = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.signUp(userData);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.signIn(credentials);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.signOut();
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.resetPassword(email);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading,
    error,
    clearError: () => setError(null)
  };
};
