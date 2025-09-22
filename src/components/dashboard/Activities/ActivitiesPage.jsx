// src/components/dashboard/Activities/ActivitiesPage.jsx - Complete with improved submission UI
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  FileText, 
  HelpCircle, 
  FlaskConical, 
  Presentation,
  Edit,
  Trash2,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivities } from '../../../hooks/dashboard/useActivities';
import sectionService from '../../../services/sectionService';
import activityService from '../../../services/dashboard/activityService';
import { formatDate, isDueToday, isOverdue } from '../../../utils/dashboard/dateUtils';
import EditActivityModal from './EditActivityModal';
import CreateActivityModal from './CreateActivityModal';

const ActivitiesPage = ({ onNavigate }) => {
  const { userData, userRole } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('active');
  
  // Add state for tracking expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());
  
  // Add state for delete confirmation
  const [deletingActivity, setDeletingActivity] = useState(null);
  
  // Add state for edit modal
  const [editingActivity, setEditingActivity] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Add state for create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const isCR = userRole === 'cr';
  const { activities, loading: activitiesLoading, refreshActivities } = useActivities(selectedSection?.id);

  // Load sections when component mounts
  useEffect(() => {
    const loadSections = async () => {
      if (!userData) return;
      
      setSectionsLoading(true);
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

  // Reset expanded descriptions when activities change
  useEffect(() => {
    setExpandedDescriptions(new Set());
  }, [activities, searchTerm, filterType, activeTab]);

  // Toggle description expansion
  const toggleDescription = (activityId) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // Handle create activity
  const handleCreateActivity = () => {
    setShowCreateModal(true);
  };

  // Handle create activity submit - FIXED
  const handleCreateSubmit = async (activityData) => {
    try {
      console.log('Creating new activity:', activityData);
      
      // Prepare complete activity data with required fields
      const completeActivityData = {
        ...activityData,                    // Data from the form
        sectionId: selectedSection.id,     // Add section ID
        crId: userData.uid,                // Add CR ID
        crName: userData.displayName || userData.email || 'Class Representative' // Add CR name for notifications
      };
      
      console.log('Complete activity data:', completeActivityData);
      
      // Call createActivity with the complete data object
      const result = await activityService.createActivity(completeActivityData);
      
      if (result.success) {
        // Refresh activities list
        if (refreshActivities) {
          refreshActivities();
        }
        
        // Close modal
        setShowCreateModal(false);
        
        // Show success message
        alert('Activity created successfully!');
        
        return { success: true };
      } else {
        console.error('Failed to create activity:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in handleCreateSubmit:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  // Handle edit activity - Open modal
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowEditModal(true);
  };

  // Handle edit activity submit
  const handleEditSubmit = async (activityId, updateData) => {
    try {
      console.log('Updating activity:', activityId, updateData);
      
      const result = await activityService.updateActivity(activityId, updateData);
      
      if (result.success) {
        // Refresh activities list
        if (refreshActivities) {
          refreshActivities();
        }
        
        // Close modal
        setShowEditModal(false);
        setEditingActivity(null);
        
        // Show success message
        alert('Activity updated successfully!');
        
        return { success: true };
      } else {
        console.error('Failed to update activity:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error in handleEditSubmit:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  // Handle delete activity
  const handleDeleteActivity = async (activity) => {
    const confirmMessage = `⚠️ Are you sure you want to delete "${activity.title}"?\n\nThis action cannot be undone and will remove the task for all students.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setDeletingActivity(activity.id);
    
    try {
      console.log('Deleting activity:', activity.id);
      
      const result = await activityService.deleteActivity(activity.id, activity.sectionId);
      
      if (result.success) {
        // Refresh activities list
        if (refreshActivities) {
          refreshActivities();
        }
        
        // Show success message
        alert('Activity deleted successfully!');
      } else {
        console.error('Failed to delete activity:', result.error);
        alert('Failed to delete activity: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity. Please try again.');
    } finally {
      setDeletingActivity(null);
    }
  };

  // Filter activities based on active tab
  const getFilteredActivities = () => {
    let filtered = activities || [];

    if (activeTab === 'active') {
      filtered = filtered.filter(activity => !isOverdue(activity.dueDate));
    } else {
      filtered = filtered.filter(activity => isOverdue(activity.dueDate));
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredActivities = getFilteredActivities();
  const activeCount = (activities || []).filter(a => !isOverdue(a.dueDate)).length;
  const pastCount = (activities || []).filter(a => isOverdue(a.dueDate)).length;

  // Get activity type icon and color
  const getActivityTypeInfo = (type) => {
    switch (type) {
      case 'quiz':
        return { 
          icon: HelpCircle, 
          color: 'text-blue-600', 
          bg: 'bg-blue-100',
          label: 'Quiz'
        };
      case 'assignment':
        return { 
          icon: FileText, 
          color: 'text-orange-600', 
          bg: 'bg-orange-100',
          label: 'Assignment'
        };
      case 'lab':
        return { 
          icon: FlaskConical, 
          color: 'text-green-600', 
          bg: 'bg-green-100',
          label: 'Lab Report'
        };
      case 'presentation':
        return { 
          icon: Presentation, 
          color: 'text-purple-600', 
          bg: 'bg-purple-100',
          label: 'Presentation'
        };
      default:
        return { 
          icon: FileText, 
          color: 'text-gray-600', 
          bg: 'bg-gray-100',
          label: 'Task'
        };
    }
  };

  // Get due date status
  const getDueDateStatus = (dueDate) => {
    if (isDueToday(dueDate)) {
      return { 
        text: 'Due Today', 
        color: 'text-red-600', 
        bg: 'bg-red-100',
        urgent: true 
      };
    }
    
    if (isOverdue(dueDate)) {
      return { 
        text: 'Overdue', 
        color: 'text-red-700', 
        bg: 'bg-red-200',
        urgent: true 
      };
    }

    const daysLeft = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 3) {
      return { 
        text: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, 
        color: 'text-orange-600', 
        bg: 'bg-orange-100',
        urgent: false 
      };
    }

    return { 
      text: formatDate(dueDate, 'relative'), 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      urgent: false 
    };
  };

  // Render description with expand/collapse functionality
  const renderDescription = (activity) => {
    const isExpanded = expandedDescriptions.has(activity.id);
    const description = activity.description || 'No description provided';
    const maxLength = 100;

    if (description.length <= maxLength) {
      return (
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      );
    }

    return (
      <p className="text-sm text-gray-600 leading-relaxed">
        {isExpanded ? (
          <>
            {description}
            <button 
              className="text-blue-600 hover:text-blue-700 text-xs font-medium ml-2"
              onClick={() => toggleDescription(activity.id)}
            >
              Show less
            </button>
          </>
        ) : (
          <>
            {description.substring(0, maxLength)}
            <span className="text-gray-400">... </span>
            <button 
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
              onClick={() => toggleDescription(activity.id)}
            >
              Read more
            </button>
          </>
        )}
      </p>
    );
  };

  // Get smart link label based on URL
  const getSmartLinkLabel = (url) => {
    if (url.includes('forms.google.com')) return 'Google Form';
    if (url.includes('classroom.google.com')) return 'Google Classroom';
    if (url.includes('drive.google.com')) return 'Google Drive';
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('docs.google.com')) return 'Google Docs';
    if (url.includes('sheets.google.com')) return 'Google Sheets';
    if (url.includes('slides.google.com')) return 'Google Slides';
    if (url.includes('canvas')) return 'Canvas';
    if (url.includes('blackboard')) return 'Blackboard';
    if (url.includes('moodle')) return 'Moodle';
    return 'Open Link';
  };

  // Show loading while sections are loading
  if (sectionsLoading) {
    return (
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading sections...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show message if no sections available
  if (!selectedSection && sections.length === 0) {
    return (
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-gray-600 mb-6">
              {isCR 
                ? "Create a section first to start managing tasks"
                : "You're not enrolled in any sections yet"
              }
            </p>
            <button
              onClick={() => onNavigate('overview')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const loading = activitiesLoading;

  return (
    <>
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Header - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">

            {/* Create Task Button */}
            {isCR && (
              <button
                onClick={handleCreateActivity}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </button>
            )}
          </div>

          {/* Section Selector */}
          {sections.length > 1 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section
              </label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const section = sections.find(s => s.id === e.target.value);
                  setSelectedSection(section);
                }}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.departmentName} - {section.batchNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search and Filter */}
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="w-full sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="quiz">Quizzes</option>
                  <option value="assignment">Assignments</option>
                  <option value="lab">Lab Reports</option>
                  <option value="presentation">Presentations</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Active Tasks</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {activeCount}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'past'
                    ? 'bg-gray-50 text-gray-700 border-b-2 border-gray-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Past Due</span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                    {pastCount}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading tasks...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterType !== 'all' ? 'No Matching Tasks' : 
                   activeTab === 'active' ? 'No Active Tasks' : 'No Past Due Tasks'}
                </h3>
                <p className="text-gray-500 text-sm">
                  {searchTerm || filterType !== 'all' ? 'Try adjusting your search or filter criteria.' :
                   activeTab === 'active' 
                    ? 'All caught up! No active tasks to show.'
                    : 'No overdue tasks. Great job staying on track!'
                  }
                </p>
                {/* Show create button if no tasks and user is CR */}
                {isCR && activeTab === 'active' && !searchTerm && filterType === 'all' && (
                  <button
                    onClick={handleCreateActivity}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Task
                  </button>
                )}
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const typeInfo = getActivityTypeInfo(activity.type);
                const dueDateStatus = getDueDateStatus(activity.dueDate);
                const TypeIcon = typeInfo.icon;
                const isDeleting = deletingActivity === activity.id;

                return (
                  <div key={activity.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      
                      {/* Header with Type and Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-2 rounded-lg ${typeInfo.bg}`}>
                            <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        
                        <div className={`px-2 py-1 text-xs font-medium rounded-full ${dueDateStatus.bg} ${dueDateStatus.color} flex items-center space-x-1`}>
                          {dueDateStatus.urgent && <AlertTriangle className="h-3 w-3" />}
                          <span>{dueDateStatus.text}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 leading-tight">
                        {activity.title}
                      </h3>

                      {/* Description */}
                      <div className="mb-3">
                        {renderDescription(activity)}
                      </div>

                      {/* Footer with Improved Submission Info - REDESIGNED */}
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        
                        {/* Top Row: Due Date and Submission Type */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due {formatDate(activity.dueDate, 'short')}</span>
                            </div>
                            
                            {activity.submissionType && (
                              <div className="flex items-center space-x-1">
                                <FileText className="h-3 w-3" />
                                <span className="capitalize">{activity.submissionType}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons - Top Right */}
                          {isCR && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditActivity(activity)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                title="Edit task"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteActivity(activity)}
                                disabled={isDeleting}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                title="Delete task"
                              >
                                {isDeleting ? (
                                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-600"></div>
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Submission Link/Location (Subtle) */}
                        {(activity.submissionLink || activity.submissionLocation) && (
                          <div className="flex items-center space-x-2">
                            
                            {/* Online Submission Link - Compact */}
                            {activity.submissionType === 'online' && activity.submissionLink && (
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                                  <div className="p-1 bg-blue-50 rounded">
                                    <ExternalLink className="h-3 w-3 text-blue-500" />
                                  </div>
                                  <span className="text-gray-500">Submit:</span>
                                </div>
                                <a
                                  href={activity.submissionLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors truncate flex items-center space-x-1"
                                  title={activity.submissionLink}
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {getSmartLinkLabel(activity.submissionLink)}
                                  </span>
                                </a>
                              </div>
                            )}
                            
                            {/* Physical Submission Location - Compact */}
                            {activity.submissionType === 'physical' && activity.submissionLocation && (
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <div className="flex items-center space-x-1.5 text-xs text-gray-600">
                                  <div className="p-1 bg-green-50 rounded">
                                    <MapPin className="h-3 w-3 text-green-500" />
                                  </div>
                                  <span className="text-gray-500">Submit at:</span>
                                </div>
                                <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded font-medium truncate">
                                  {activity.submissionLocation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Activity Modal */}
      <CreateActivityModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        sectionId={selectedSection?.id}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingActivity(null);
        }}
        onSubmit={handleEditSubmit}
        activity={editingActivity}
        sectionId={selectedSection?.id}
      />
    </>
  );
};

export default ActivitiesPage;
