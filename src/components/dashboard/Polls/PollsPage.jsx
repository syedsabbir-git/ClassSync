// src/components/dashboard/Polls/PollsPage.jsx - Mobile Responsive
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  BarChart3, 
  Calendar,
  User,
  Check,
  X,
  Users,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDate } from '../../../utils/dashboard/dateUtils';
import CreatePollModal from './CreatePollModal';
import pollService from '../../../services/pollService';
import sectionService from '../../../services/sectionService';

const PollsPage = ({ onNavigate }) => {
  const { userData, userRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  // Load polls when section changes
  useEffect(() => {
    const loadPolls = async () => {
      if (!selectedSection) {
        setPolls([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await pollService.getPollsBySection(selectedSection.id, true);
        if (result.success) {
          setPolls(result.polls || []);
        } else {
          setPolls([]);
        }
      } catch (err) {
        console.error('Error loading polls:', err);
        setPolls([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSection) {
      loadPolls();
    }
  }, [selectedSection]);

  // Filter polls
  const filteredPolls = polls.filter(poll =>
    poll.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePoll = async (pollData) => {
    if (!selectedSection) {
      return { success: false, error: 'Please select a section first' };
    }

    const result = await pollService.createPoll({
      ...pollData,
      sectionId: selectedSection.id,
      crId: userData.uid,
      crName: userData.name
    });
    
    if (result.success) {
      // Reload polls
      const updatedResult = await pollService.getPollsBySection(selectedSection.id, true);
      if (updatedResult.success) {
        setPolls(updatedResult.polls || []);
      }
      setShowCreateModal(false);
    }
    
    return result;
  };

  const handlePollResponse = async (pollId, selectedOptions) => {
    const result = await pollService.submitPollResponse({
      pollId,
      studentId: userData.uid,
      studentName: userData.name,
      selectedOptions
    });

    if (result.success) {
      // Reload polls to update response counts
      const updatedResult = await pollService.getPollsBySection(selectedSection.id, true);
      if (updatedResult.success) {
        setPolls(updatedResult.polls || []);
      }
    } else {
      alert(result.error);
    }
  };

  const handleClosePoll = async (pollId) => {
    const result = await pollService.updatePollStatus(pollId, 'closed');
    if (result.success) {
      setPolls(prev => prev.map(poll => 
        poll.id === pollId ? { ...poll, status: 'closed' } : poll
      ));
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      const result = await pollService.deletePoll(pollId);
      if (result.success) {
        setPolls(prev => prev.filter(p => p.id !== pollId));
      }
    }
  };

  // Show loading state while sections are loading
  if (sectionsLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 text-sm">Loading sections...</span>
        </div>
      </div>
    );
  }

  // Show message if no sections available
  if (!selectedSection && sections.length === 0) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
            <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Sections Available</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
              {isCR 
                ? "Create a section first to start creating polls"
                : "You're not enrolled in any sections yet"
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <div className="space-y-3 sm:space-y-4">
          {/* Create Button - Full width on mobile */}
          {isCR && selectedSection && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </button>
          )}

          {/* Search - Full width on mobile */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search polls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Polls List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Loading polls...</span>
          </div>
        ) : filteredPolls.length === 0 ? (
          <div className="bg-white rounded-lg p-6 sm:p-12 text-center">
            <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching polls' : 'No polls yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : (isCR 
                  ? "Create your first poll to get started" 
                  : "No polls have been created yet"
                )
              }
            </p>
            {isCR && !searchQuery && selectedSection && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Poll
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                isCR={isCR}
                userId={userData.uid}
                onResponse={handlePollResponse}
                onClose={handleClosePoll}
                onDelete={handleDeletePoll}
              />
            ))}
          </div>
        )}

        {/* Create Poll Modal */}
        {isCR && selectedSection && (
          <CreatePollModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreatePoll}
            sectionId={selectedSection.id}
          />
        )}
      </div>
    </div>
  );
};

// Mobile-Responsive Poll Card Component
const PollCard = ({ poll, isCR, userId, onResponse, onClose, onDelete }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasResponded, setHasResponded] = useState(false);

  useEffect(() => {
    setHasResponded(poll.respondedUsers?.includes(userId) || false);
  }, [poll, userId]);

  const handleOptionToggle = (optionId) => {
    if (poll.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) {
      alert('Please select at least one option');
      return;
    }
    onResponse(poll.id, selectedOptions);
    setSelectedOptions([]);
  };

  const getVotePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 space-y-3 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 leading-tight pr-2">
            {poll.question}
          </h3>
          
          {/* Meta Info - Stack on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">By {poll.crName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{formatDate(poll.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{poll.totalResponses || 0} responses</span>
            </div>
          </div>
        </div>
        
        {/* Status and Actions */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            poll.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {poll.status === 'active' ? 'Active' : 'Closed'}
          </span>
          
          {isCR && (
            <div className="flex items-center space-x-1">
              {poll.status === 'active' && (
                <button
                  onClick={() => onClose(poll.id)}
                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                  title="Close poll"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(poll.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete poll"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Poll Options - Mobile Optimized */}
      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const percentage = getVotePercentage(option.votes || 0, poll.totalResponses || 0);
          const isSelected = selectedOptions.includes(index);
          
          return (
            <div key={index} className="relative">
              <div 
                className={`border rounded-lg p-3 transition-colors ${
                  hasResponded || poll.status !== 'active'
                    ? 'bg-gray-50 cursor-not-allowed'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 cursor-pointer'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
                onClick={() => {
                  if (!hasResponded && poll.status === 'active' && !isCR) {
                    handleOptionToggle(index);
                  }
                }}
              >
                
                {/* Option Content - Mobile Layout */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                    {!hasResponded && poll.status === 'active' && !isCR ? (
                      <input
                        type={poll.allowMultiple ? 'checkbox' : 'radio'}
                        checked={isSelected}
                        readOnly
                        className="h-4 w-4 text-blue-600 border-gray-300 mt-0.5 flex-shrink-0"
                      />
                    ) : null}
                    <span className="text-sm sm:text-base text-gray-900 leading-tight">
                      {option.text}
                    </span>
                  </div>
                  
                  {/* Vote Stats - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 text-right ml-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm text-gray-600">
                      {option.votes || 0} votes
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {percentage}%
                    </span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Button - Mobile Optimized */}
      {!isCR && !hasResponded && poll.status === 'active' && (
        <div className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={selectedOptions.length === 0}
            className="w-full px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Response
          </button>
        </div>
      )}
      
      {/* Response Status */}
      {hasResponded && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-green-700 font-medium">
              You have already responded to this poll
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollsPage;
