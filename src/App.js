// src/App.js - Updated to use Unified Dashboard

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import CreateSection from './pages/CreateSection';
import EnrollSection from './pages/EnrollSection';
import Dashboard from './pages/Dashboard'; // New unified dashboard
import sectionService from './services/sectionService';

// Main App Router Component
function AppRouter() {
  const { currentUser, userRole, userData, loading } = useAuth();
  const [hasSection, setHasSection] = useState(false);
  const [checkingSection, setCheckingSection] = useState(true);

  // Check if user has sections when authenticated
  useEffect(() => {
    const checkUserSections = async () => {
      if (currentUser && userData) {
        setCheckingSection(true);
        try {
          if (userRole === 'cr') {
            const result = await sectionService.getCRSections(userData.uid);
            setHasSection(result.success && result.sections.length > 0);
          } else if (userRole === 'student') {
            const result = await sectionService.getStudentSections(userData.uid);
            setHasSection(result.success && result.sections.length > 0);
          }
        } catch (error) {
          console.error('Error checking sections:', error);
        } finally {
          setCheckingSection(false);
        }
      } else {
        setCheckingSection(false);
      }
    };

    checkUserSections();
  }, [currentUser, userData, userRole]);

  const handleAuthSuccess = (userData) => {
    // This will be handled by the AuthContext automatically
    console.log('Authentication successful:', userData);
  };

  const handleSectionCreated = (sectionData) => {
    setHasSection(true);
  };

  const handleEnrollmentSuccess = (sectionData) => {
    setHasSection(true);
  };

  // Show loading while checking authentication or sections
  if (loading || checkingSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Routing logic based on authentication and user state
  // Not authenticated - show landing page
  if (!currentUser) {
    return <LandingPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Authenticated CR without section - show create section page
  if (userRole === 'cr' && !hasSection) {
    return <CreateSection onSectionCreated={handleSectionCreated} />;
  }

  // Authenticated Student without section - show enroll page
  if (userRole === 'student' && !hasSection) {
    return <EnrollSection onEnrollmentSuccess={handleEnrollmentSuccess} />;
  }

  // Authenticated user with sections - show unified dashboard
  if ((userRole === 'cr' || userRole === 'student') && hasSection) {
    return <Dashboard />;
  }

  // Fallback
  return <LandingPage onAuthSuccess={handleAuthSuccess} />;
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRouter />
      </div>
    </AuthProvider>
  );
}

export default App;