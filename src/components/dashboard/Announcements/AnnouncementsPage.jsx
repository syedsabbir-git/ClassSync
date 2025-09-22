// src/components/dashboard/Announcements/AnnouncementsPage.jsx - Mobile Responsive
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  User,
  Edit,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../utils/dashboard/dateUtils';
import CreateAnnouncementModal from './CreateAnnouncementModal';
import announcementService from '../../../services/announcementService';
import sectionService from '../../../services/sectionService';

const AnnouncementsPage = ({ onNavigate }) => {
  const { userData, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit functionality state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Section management
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const isCR = userRole === 'cr';

  // Load sections when component mounts
  useEffect(() => {
    const loadSections = async () => {
      if (!userData) return;

      try {
        let result;
        if (isCR) {
          result = await sectionService.getCRSections(userData.uid);
        } else {
          result = await sectionService.getStudentSections(userData.uid);
        }

        if (result.success && result.sections.length > 0) {
          setSections(result.sections);
          setSelectedSection(result.sections[0]);
        } else {
          setSections([]);
          setSelectedSection(null);
        }
      } catch (err) {
        console.error('Error loading sections:', err);
        setSections([]);
        setSelectedSection(null);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSections();
  }, [userData, isCR]);

  // Load announcements when section changes
  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!selectedSection) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await announcementService.getAnnouncementsBySection(selectedSection.id);
        if (result.success) {
          setAnnouncements(result.announcements || []);
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
        console.error('Error loading announcements:', err);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSection) {
      loadAnnouncements();
    }
  }, [selectedSection]);

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAnnouncement = async (announcementData) => {
    if (!selectedSection) {
      return { success: false, error: 'Please select a section first' };
    }

    const result = await announcementService.createAnnouncement({
      ...announcementData,
      sectionId: selectedSection.id,
      crId: userData.uid,
      crName: userData.name
    });

    if (result.success) {
      // Reload announcements
      const updatedResult = await announcementService.getAnnouncementsBySection(selectedSection.id);
      if (updatedResult.success) {
        setAnnouncements(updatedResult.announcements || []);
      }
      setShowCreateModal(false);
    }

    return result;
  };

  // Handle edit announcement
  const handleEditAnnouncement = async (announcementData) => {
    if (!editingAnnouncement) {
      return { success: false, error: 'No announcement selected for editing' };
    }

    const result = await announcementService.updateAnnouncement(editingAnnouncement.id, announcementData);

    if (result.success) {
      // Update the announcement in the local state
      setAnnouncements(prev => prev.map(announcement =>
        announcement.id === editingAnnouncement.id
          ? { ...announcement, ...announcementData, updatedAt: new Date().toISOString() }
          : announcement
      ));

      // Close modal and reset editing state
      setShowEditModal(false);
      setEditingAnnouncement(null);
    }

    return result;
  };

  // Open edit modal
  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAnnouncement(null);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      const result = await announcementService.deleteAnnouncement(announcementId);
      if (result.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Normal';
    }
  };

  // Show loading state while sections are loading
  if (sectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 text-sm">Loading sections...</span>
      </div>
    );
  }

  // Show message if no sections available
  if (!selectedSection && sections.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
            <MessageSquare className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              {isCR
                ? "Create a section first to start making announcements"
                : "You're not enrolled in any sections yet"
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">  

        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          {/* Create Button and Section Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">

            {/* Create Button - Full width on mobile */}
            {isCR && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </button>
            )}

            {/* Section Info - Hidden on mobile, shown on desktop */}
            {selectedSection && (
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{selectedSection.departmentName}</p>
                <p className="text-xs text-gray-500">Batch: {selectedSection.batchNumber}</p>
              </div>
            )}
          </div>

          {/* Search Bar - Full width on mobile */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Loading...</span>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
            <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching announcements' : 'No announcements yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms'
                : (isCR
                  ? "Create your first announcement to get started"
                  : "No announcements have been posted yet"
                )
              }
            </p>
            {isCR && !searchQuery && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredAnnouncements.map((announcement) => (
  <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 mb-4 sm:mb-0">
        
        {/* Header Section - Fixed Alignment */}
        <div className="flex items-start justify-between mb-3">
          {/* Left side - Dot, Title, and Priority aligned */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Priority dot aligned with title */}
            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(announcement.priority)}`}></div>
            
            {/* Title and Priority Badge Container */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                  {announcement.title}
                </h3>
                <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 self-start sm:self-auto">
                  {getPriorityText(announcement.priority)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content - Aligned with title */}
        <div className="ml-6">
          <p className="text-sm sm:text-base text-gray-600 mb-4 leading-relaxed">
            {announcement.content}
          </p>
          
          {/* Meta Information - Aligned with content */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>By {announcement.crName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{formatDate(announcement.createdAt, 'full')}</span>
            </div>
            {announcement.updatedAt !== announcement.createdAt && (
              <div className="flex items-center space-x-1 text-blue-600">
                <Edit className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Edited {formatDate(announcement.updatedAt, 'relative')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions - Position better on mobile */}
      {isCR && announcement.crId === userData.uid && (
        <div className="flex items-center justify-end sm:justify-start space-x-1 sm:space-x-2 sm:ml-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
          <button
            onClick={() => openEditModal(announcement)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
            title="Edit announcement"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteAnnouncement(announcement.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
            title="Delete announcement"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  </div>
))}


          </div>
        )}

        {/* Create Announcement Modal */}
        {isCR && selectedSection && (
          <CreateAnnouncementModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateAnnouncement}
            sectionId={selectedSection.id}
          />
        )}

        {/* Edit Announcement Modal */}
        {isCR && editingAnnouncement && (
          <CreateAnnouncementModal
            isOpen={showEditModal}
            onClose={closeEditModal}
            onSubmit={handleEditAnnouncement}
            sectionId={selectedSection.id}
            initialData={{
              title: editingAnnouncement.title,
              content: editingAnnouncement.content,
              priority: editingAnnouncement.priority
            }}
            isEditing={true}
          />
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
