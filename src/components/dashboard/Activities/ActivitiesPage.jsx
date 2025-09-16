// src/components/dashboard/Activities/ActivitiesPage.jsx - Updated with edit functionality
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Calendar,
  Clock,
  FileText,
  Link,
  MapPin,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivities } from '../../../hooks/dashboard/useActivities';
import { formatDate, isDueToday, isOverdue } from '../../../utils/dashboard/dateUtils';
import CreateActivityModal from './CreateActivityModal';
import EditActivityModal from './EditActivityModal'; // Add this import
import sectionService from '../../../services/sectionService';

const ActivitiesPage = ({ onNavigate }) => {
  const { userData, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Add this state
  const [editingActivity, setEditingActivity] = useState(null); // Add this state
  const [activeTab, setActiveTab] = useState('active');
  
  // Section management
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const isCR = userRole === 'cr';
  
  const { activities, loading, createActivity, updateActivity, deleteActivity } = useActivities(selectedSection?.id);

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

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Separate active and past due activities
  const activeActivities = filteredActivities.filter(activity => !isOverdue(activity.dueDate));
  const pastDueActivities = filteredActivities.filter(activity => isOverdue(activity.dueDate));

  const currentActivities = activeTab === 'active' ? activeActivities : pastDueActivities;

  const handleCreateActivity = async (activityData) => {
    if (!selectedSection) {
      return { success: false, error: 'Please select a section first' };
    }

    const result = await createActivity({
      ...activityData,
      sectionId: selectedSection.id,
      crId: userData.uid
    });
    
    if (result.success) {
      setShowCreateModal(false);
    }
    
    return result;
  };

  // Add edit activity handler
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
    setShowEditModal(true);
  };

  // Add update activity handler
  const handleUpdateActivity = async (activityId, updateData) => {
    const result = await updateActivity(activityId, updateData);
    
    if (result.success) {
      setShowEditModal(false);
      setEditingActivity(null);
    }
    
    return result;
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await deleteActivity(activityId, selectedSection?.id);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return '❓';
      case 'assignment': return '📄';
      case 'lab': return '🧪';
      case 'presentation': return '📊';
      default: return '📝';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'quiz': return 'bg-blue-100 text-blue-700';
      case 'assignment': return 'bg-orange-100 text-orange-700';
      case 'lab': return 'bg-green-100 text-green-700';
      case 'presentation': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
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
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-gray-600 mb-6">
              {isCR 
                ? "Create a section first to start managing tasks"
                : "You're not enrolled in any sections yet"
              }
            </p>
            {isCR && (
              <button
                onClick={() => onNavigate('sections')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Section
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {isCR && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Task
              </button>
            )}
          </div>

          {/* Section selector if multiple sections */}
          {sections.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
              <select
                value={selectedSection?.id || ''}
                onChange={(e) => {
                  const section = sections.find(s => s.id === e.target.value);
                  setSelectedSection(section);
                }}
                className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="assignment">Assignments</option>
                <option value="quiz">Quizzes</option>
                <option value="lab">Lab Reports</option>
                <option value="presentation">Presentations</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('active')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Active Tasks ({activeActivities.length})
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'past'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Past Due ({pastDueActivities.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Activities List */}
        {currentActivities.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'active' ? 'No Active Tasks' : 'No Past Due Tasks'}
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'active' 
                ? (isCR ? "Create your first task to get started" : "No current assignments")
                : "No overdue tasks - you're all caught up!"
              }
            </p>
            {isCR && activeTab === 'active' && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentActivities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getTypeIcon(activity.type)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{activity.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(activity.type)}`}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </span>
                      {activeTab === 'past' && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          Past Due
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{activity.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span className={
                          isOverdue(activity.dueDate) ? 'text-red-600 font-medium' :
                          isDueToday(activity.dueDate) ? 'text-orange-600 font-medium' : ''
                        }>
                          Due {formatDate(activity.dueDate, 'full')}
                        </span>
                      </div>
                      
                      {activity.submissionType && (
                        <div className="flex items-center space-x-1">
                          {activity.submissionType === 'online' ? (
                            <>
                              <Link className="h-4 w-4" />
                              <span>Online submission</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              <span>Physical submission</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submission Details */}
                    {activity.submissionLink && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Link className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Submission Link:</span>
                        </div>
                        <a
                          href={activity.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 block"
                        >
                          {activity.submissionLink}
                        </a>
                      </div>
                    )}
                    
                    {activity.submissionLocation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Submit to:</span>
                          <span className="text-sm text-gray-700">{activity.submissionLocation}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions - Only for CR */}
                  {isCR && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit task"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete task"
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

        {/* Create Activity Modal */}
        {isCR && selectedSection && (
          <CreateActivityModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateActivity}
            sectionId={selectedSection.id}
          />
        )}

        {/* Edit Activity Modal */}
        {isCR && selectedSection && (
          <EditActivityModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingActivity(null);
            }}
            onSubmit={handleUpdateActivity}
            activity={editingActivity}
            sectionId={selectedSection.id}
          />
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
