// src/components/dashboard/Layout/Header.jsx - Updated to show notifications for both CR and students
import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../hooks/dashboard/useNotifications';
import NotificationDropdown from '../Shared/NotificationDropdown';

const Header = ({ onMenuClick, sidebarOpen, currentPage, pageTitle, pageSubtitle, onNavigate }) => {
  const { userData, userRole } = useAuth();
  const isCR = userRole === 'cr';
  
  // Show notifications for BOTH CRs and students
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications(
    userData?.uid // Remove the !isCR condition - now works for both
  );

  const getPageInfo = () => {
    switch(currentPage) {
      case 'activities':
        return { 
          title: isCR ? 'Manage Tasks' : 'My Tasks', 
          subtitle: isCR ? 'Create and manage assignments for your students' : 'View your assignments and deadlines' 
        };
      case 'announcements':
        return { 
          title: 'Announcements', 
          subtitle: isCR ? 'Create and manage announcements for your students' : 'Stay updated with latest news and updates' 
        };
      case 'polls':
        return { 
          title: 'Polls & Surveys', 
          subtitle: isCR ? 'Create and manage polls for your students' : 'Participate in polls and surveys' 
        };
      case 'calendar':
        return { 
          title: 'Calendar', 
          subtitle: 'View your schedule and important dates' 
        };
      case 'analytics':
        return { 
          title: 'Analytics', 
          subtitle: 'Track your academic progress and performance' 
        };
      case 'students':
        return { 
          title: 'Students', 
          subtitle: 'Manage students in your sections' 
        };
      case 'settings':
        return { 
          title: 'Settings', 
          subtitle: 'Manage your account and preferences' 
        };
      case 'resources':
        return { 
          title: 'Resources', 
          subtitle: 'Share and discover learning materials from the community'
        };
      case 'overview':
      default:
        return { 
          title: 'Dashboard', 
          subtitle: isCR ? 'Overview of your class management' : 'Overview of your academic progress' 
        };
    }
  };

  const pageInfo = getPageInfo();

  const handleNotificationClick = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'task':
        onNavigate && onNavigate('activities');
        break;
      case 'announcement':
        onNavigate && onNavigate('announcements');
        break;
      case 'poll':
        onNavigate && onNavigate('polls');
        break;
      default:
        break;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle mobile menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Page Title */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {pageTitle || pageInfo.title}
            </h1>
            <p className="text-sm text-gray-600 hidden sm:block">
              {pageSubtitle || pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Notifications - Now for BOTH CRs and students */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onNotificationClick={handleNotificationClick}
          />

          {/* User Avatar */}
          <div className="hidden sm:flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{userData?.name}</p>
              <p className="text-xs text-gray-500">{isCR ? 'Class Representative' : 'Student'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
