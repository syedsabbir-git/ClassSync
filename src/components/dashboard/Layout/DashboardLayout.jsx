// src/components/dashboard/Layout/DashboardLayout.jsx - Updated to show header on all pages
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import MainContent from './MainContent';
import LoadingSpinner from '../Shared/LoadingSpinner';

const DashboardLayout = ({ children, currentPage = 'overview', onNavigate }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loading } = useAuth();

  // Show header on ALL pages now
  // Removed: const showHeader = currentPage === 'overview';

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />
      
      {/* Main Content Area - Adjust for fixed sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-60">
        {/* Header - Now shows on ALL pages with page-specific content */}
        <Header 
          onMenuClick={() => {
            setSidebarOpen(!sidebarOpen);
            setIsMobileMenuOpen(!isMobileMenuOpen);
            onNavigate={onNavigate}
          }}
          sidebarOpen={sidebarOpen}
          currentPage={currentPage}
        />
        
        {/* Main Content */}
        <MainContent sidebarOpen={sidebarOpen}>
          {children}
        </MainContent>
      </div>
    </div>
  );
};

export default DashboardLayout;
