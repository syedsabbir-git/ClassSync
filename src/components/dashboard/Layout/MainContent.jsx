// src/components/dashboard/Layout/MainContent.jsx
import React from 'react';

const MainContent = ({ children, sidebarOpen }) => {
  return (
    <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
      sidebarOpen ? 'lg:pl-0' : 'lg:pl-0'
    }`}>
      <div className="p-6">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
