// src/components/dashboard/Announcements/AnnouncementsPage.jsx - Complete with Edit functionality
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

  // NEW: Handle edit announcement
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

  // NEW: Open edit modal
  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditModal(true);
  };

  // NEW: Close edit modal
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
        <span className="ml-2 text-gray-600">Loading sections...</span>
      </div>
    );
  }

  // Show message if no sections available
  if (!selectedSection && sections.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-gray-600 mb-6">
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {/* Only show Create button for CR */}
            {isCR && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Announcement
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching announcements' : 'No announcements yet'}
            </h3>
            <p className="text-gray-500 mb-4">
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
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Announcement
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(announcement.priority)}`}></div>
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getPriorityText(announcement.priority)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4 leading-relaxed">{announcement.content}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>By {announcement.crName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(announcement.createdAt, 'full')}</span>
                      </div>
                      {announcement.updatedAt !== announcement.createdAt && (
                        <div className="flex items-center space-x-1 text-blue-600">
                          <Edit className="h-4 w-4" />
                          <span>Edited {formatDate(announcement.updatedAt, 'relative')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions - Only for CR */}
                  {isCR && announcement.crId === userData.uid && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(announcement)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit announcement"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
