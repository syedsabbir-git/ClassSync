// src/components/dashboard/Layout/Sidebar.jsx - Sign out button above user info
import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Bell,
  BookOpen,
  GraduationCap,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import authService from '../../../services/authService';

const Sidebar = ({ isOpen, isMobileOpen, onClose, currentPage, onNavigate }) => {
  const { userRole, userData } = useAuth();
  const isCR = userRole === 'cr';

  const navigationItems = [
    { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'activities', name: 'My Tasks', icon: ClipboardList },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'resources', name: 'Resources', icon: BookOpen },
    { id: 'polls', name: 'Polls', icon: BarChart3 },
    ...(isCR ? [{ id: 'students', name: 'Students', icon: Users }] : []),
    { id: 'announcements', name: 'Announcements', icon: Bell },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    if (isMobileOpen) onClose();
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Different classes for desktop and mobile
  const desktopClasses = `hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:bg-white lg:border-r lg:border-gray-100 lg:z-40`;

  const mobileClasses = `fixed inset-0 z-50 lg:hidden ${isMobileOpen ? '' : 'pointer-events-none'}`;

  const drawerClasses = `fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
    }`;

  return (
    <>
      {/* Desktop Sidebar - Fixed Height */}
      <div className={desktopClasses}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-6 flex-shrink-0">
            <img
              src="/logo192.png"
              alt="ClassSync Logo"
              className="w-10 h-10 object-contain rounded-md"
            />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">ClassSync</h1>
              <p className="text-xs text-gray-500">{isCR ? 'CR Dashboard' : 'Student Dashboard'}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="flex-shrink-0">
            {/* Sign Out Button - Above user info */}
            <div className="px-4 pb-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
              >
                <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* User Profile - Below sign out */}
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userData?.name}</p>
                  <p className="text-xs text-gray-500">Computer Science</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Drawer */}
      <div className={mobileClasses}>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ${isMobileOpen ? 'opacity-75' : 'opacity-0 pointer-events-none'
            }`}
          onClick={onClose}
        />

        {/* Drawer */}
        <div className={drawerClasses}>
          <div className="flex flex-col h-full">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between px-6 py-6 flex-shrink-0">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">ClassSync</h1>
                  <p className="text-xs text-gray-500">{isCR ? 'CR Dashboard' : 'Student Dashboard'}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 overflow-y-auto">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="flex-1 text-left">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Bottom Section */}
            <div className="flex-shrink-0">
              {/* Sign Out Button - Above user info */}
              <div className="px-4 pb-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors group"
                >
                  <LogOut className="w-4 h-4 mr-3 text-gray-400 group-hover:text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* User Profile - Below sign out */}
              <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center px-3 py-2 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{userData?.name}</p>
                    <p className="text-xs text-gray-500">Computer Science</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
