// src/pages/Dashboard.jsx - Fixed with proper navigation props
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/dashboard/Layout/DashboardLayout';
import OverviewPage from '../components/dashboard/Overview/OverviewPage';
import ActivitiesPage from '../components/dashboard/Activities/ActivitiesPage';
import CalendarPage from '../components/dashboard/Calendar/CalendarPage';
import StudentsPage from '../components/dashboard/Students/StudentsPage';
import SettingsPage from '../components/dashboard/Settings/SettingsPage';
import LandingPage from './LandingPage';
import AnnouncementsPage from '../components/dashboard/Announcements/AnnouncementsPage';
import PollsPage from '../components/dashboard/Polls/PollsPage';
import ResourcesPage from '../components/dashboard/Resources/ResourcesPage';

const Dashboard = () => {
  const [currentPage, setCurrentPage] = useState('overview');
  const { userRole } = useAuth();
  const isCR = userRole === 'cr';

  // Handle navigation from sidebar
  const handleNavigation = (page) => {
    console.log('Navigating to:', page); // Debug log
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={handleNavigation} />;
      case 'activities':
        return <ActivitiesPage onNavigate={handleNavigation} />;
      case 'calendar':
        return <CalendarPage onNavigate={handleNavigation} />;
      case 'students':
        return isCR ? <StudentsPage onNavigate={handleNavigation} /> : <OverviewPage onNavigate={handleNavigation} />;
      case 'announcements':
        return <AnnouncementsPage onNavigate={handleNavigation} />;
      case 'polls':
        return <PollsPage onNavigate={handleNavigation} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigation} />;
      case 'resources':
        return <ResourcesPage onNavigate={handleNavigation} />;
      case 'landingpage':
        return <LandingPage onNavigate={handleNavigation} />;
      default:
        return <OverviewPage onNavigate={handleNavigation} />;
    }
  };

  return (
    <DashboardLayout 
      currentPage={currentPage}
      onNavigate={handleNavigation}
    >
      {renderCurrentPage()}
    </DashboardLayout>
  );
};

export default Dashboard;
