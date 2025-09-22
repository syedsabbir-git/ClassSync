// src/components/dashboard/Overview/OverviewPage.jsx - Complete with Course Resources
import React, { useState, useEffect } from 'react';
import {
  FileText,
  HelpCircle,
  FlaskConical,
  Presentation,
  Calendar,
  Clock,
  Bell,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Zap,
  Activity,
  Plus,
  Clipboard as ClipboardIcon,
  MessageSquare,
  Copy,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivities } from '../../../hooks/dashboard/useActivities';
import sectionService from '../../../services/sectionService';
import announcementService from '../../../services/announcementService';
import pollService from '../../../services/pollService';
import courseResourcesService from '../../../services/courseResourcesService';
import { formatDate, isDueToday, isOverdue } from '../../../utils/dashboard/dateUtils';
import CreateAnnouncementModal from '../Announcements/CreateAnnouncementModal';
import CreatePollModal from '../Polls/CreatePollModal';
import CourseResourcesModal from '../CourseResources/CourseResourcesModal';

// Clipboard copy helper
const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }, (err) => {
      alert('Failed to copy: ' + err);
    });
  } else {
    // fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      alert(successful ? 'Copied to clipboard!' : 'Failed to copy');
    } catch {
      alert('Failed to copy');
    }
    document.body.removeChild(textArea);
  }
};
// Add this missing function
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-orange-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};
// Simple Pressure Indicator Component
const PressureIndicator = ({ pressure }) => {
  const percentage = Math.max(0, Math.min(100, pressure));

  const getColor = () => {
    if (percentage <= 20) return 'bg-green-500';
    if (percentage <= 40) return 'bg-yellow-500';
    if (percentage <= 60) return 'bg-orange-500';
    if (percentage <= 80) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getTextColor = () => {
    if (percentage <= 20) return 'text-green-600';
    if (percentage <= 40) return 'text-yellow-600';
    if (percentage <= 60) return 'text-orange-600';
    if (percentage <= 80) return 'text-red-600';
    return 'text-red-700';
  };

  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-6 mb-3">
        <div
          className={`h-6 rounded-full transition-all duration-700 ${getColor()} flex items-center justify-end pr-2`}
          style={{ width: `${percentage}%` }}
        >
          <span className="text-white text-xs font-bold">
            {percentage > 15 ? `${percentage}%` : ''}
          </span>
        </div>
      </div>

      {percentage <= 15 && (
        <div className="text-right">
          <span className={`text-sm font-bold ${getTextColor()}`}>
            {percentage}%
          </span>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// Announcement Card Component with Fixed Height
const AnnouncementCard = ({ announcement, onClick }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Truncate content to fit card
  const truncateContent = (text, maxLength = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div
      onClick={onClick}
      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors h-16"
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {announcement.title}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {truncateContent(announcement.content)}
          </p>
        </div>

        {/* Right side - Date and Priority */}
        <div className="flex flex-col items-end ml-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(announcement.priority)}`}></div>
            <span className="text-xs text-gray-500">
              {formatDate(announcement.createdAt, 'short')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Poll Card Component for Overview with Fixed Height
const PollOverviewCard = ({ poll, onClick, showResults = false, isCR }) => {
  const getVotePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getTopOption = (options, totalResponses) => {
    if (!options || options.length === 0) return null;

    const sortedOptions = [...options].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const topOption = sortedOptions[0];

    if (totalResponses === 0) return { ...topOption, percentage: 0 };

    return {
      ...topOption,
      percentage: getVotePercentage(topOption.votes || 0, totalResponses || 0)
    };
  };

  const topOption = showResults ? getTopOption(poll.options, poll.totalResponses) : null;

  // Truncate text to fit card
  const truncateText = (text, maxLength = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <div
      onClick={onClick}
      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors h-16"
    >
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate leading-tight">
            {truncateText(poll.question)}
          </p>
          {showResults && topOption && poll.totalResponses > 0 ? (
            <div className="text-xs text-gray-600">
              <span className="font-medium">{truncateText(topOption.text, 20)}</span>
              <span className="text-gray-500"> ({topOption.percentage}%)</span>
            </div>
          ) : (
            <div className="text-xs text-gray-500">
              {poll.totalResponses || 0} responses
            </div>
          )}
        </div>

        <div className="flex flex-col items-end ml-3 flex-shrink-0">
          <span className={`px-2 py-0.5 text-xs rounded-full ${poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
            {poll.status === 'active' ? 'Active' : 'Closed'}
          </span>

          {poll.status === 'active' && !isCR && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
            >
              Participate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
// Add this component before your main OverviewPage component

// Updated CourseResourceRow component - Mobile Responsive
const CourseResourceRow = ({ course, isCR, onEdit, onDelete }) => {
  const handleResourceClick = (resourceType, url) => {
    if (!url || url.trim() === '') {
      alert(`No ${resourceType} link available for this course`);
      return;
    }

    if (resourceType === 'Enrollment Key') {
      copyToClipboard(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const getResourceButton = (type, url, label) => {
    const hasResource = url && url.trim() !== '';

    const getIcon = () => {
      switch (type) {
        case 'telegram':
          return (
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${hasResource ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z" />
              </svg>
            </div>
          );
        case 'whatsapp':
          return (
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${hasResource ? 'bg-green-500' : 'bg-gray-400'
              }`}>
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488" />
              </svg>
            </div>
          );
        case 'blc':
          return (
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${hasResource ? 'bg-indigo-600' : 'bg-gray-400'
              }`}>
              BLC
            </div>
          );
        case 'key':
          return (
            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${hasResource ? 'bg-orange-500' : 'bg-gray-400'
              }`}>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 0 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" />
              </svg>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <button
        onClick={() => handleResourceClick(label, url)}
        className={`p-1 sm:p-2 rounded-lg transition-all ${hasResource
          ? 'hover:scale-110 hover:shadow-md'
          : 'opacity-60 hover:opacity-100'
          }`}
        title={hasResource ? `Click to ${type === 'key' ? 'copy' : 'open'} ${label}` : `No ${label} available`}
      >
        {getIcon()}
      </button>
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 sm:py-4 px-2 sm:px-4">
        <div className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">{course.courseName}</div>
      </td>

      {/* Telegram */}
      <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
        {getResourceButton('telegram', course.telegramLink, 'Telegram Group')}
      </td>

      {/* WhatsApp */}
      <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
        {getResourceButton('whatsapp', course.whatsappLink, 'WhatsApp Group')}
      </td>

      {/* BLC */}
      <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
        {getResourceButton('blc', course.blcLink, 'BLC Course')}
      </td>

      {/* Enrollment Key */}
      <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
        {getResourceButton('key', course.enrollmentKey, 'Enrollment Key')}
      </td>

      {/* Actions for CR */}
      {isCR && (
        <td className="py-3 sm:py-4 px-1 sm:px-2 text-center">
          <div className="flex items-center justify-center space-x-0.5 sm:space-x-1">
            <button
              onClick={onEdit}
              className="p-1 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
};




const OverviewPage = ({ onNavigate }) => {
  const { userData, userRole } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);

  // Polls state
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);

  // Course Resources state
  const [courseResources, setCourseResources] = useState([]);
  const [courseResourcesLoading, setCourseResourcesLoading] = useState(true);
  const [showCourseResourcesModal, setShowCourseResourcesModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const isCR = userRole === 'cr';
  const { activities, loading: activitiesLoading } = useActivities(selectedSection?.id);

  // Load sections
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
        }
      } catch (err) {
        console.error('Error loading sections:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [userData, isCR]);

  // Load announcements when section changes
  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!selectedSection) {
        setAnnouncements([]);
        setAnnouncementsLoading(false);
        return;
      }

      setAnnouncementsLoading(true);
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
        setAnnouncementsLoading(false);
      }
    };

    if (selectedSection) {
      loadAnnouncements();
    }
  }, [selectedSection]);

  // Load polls when section changes
  useEffect(() => {
    const loadPolls = async () => {
      if (!selectedSection) {
        setPolls([]);
        setPollsLoading(false);
        return;
      }

      setPollsLoading(true);
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
        setPollsLoading(false);
      }
    };

    if (selectedSection) {
      loadPolls();
    }
  }, [selectedSection]);

  // Load course resources when section changes
  useEffect(() => {
    const loadCourseResources = async () => {
      if (!selectedSection) {
        setCourseResources([]);
        setCourseResourcesLoading(false);
        return;
      }

      setCourseResourcesLoading(true);
      try {
        const result = await courseResourcesService.getCourseResourcesBySection(selectedSection.id);
        if (result.success) {
          setCourseResources(result.resources || []);
        } else {
          setCourseResources([]);
        }
      } catch (err) {
        console.error('Error loading course resources:', err);
        setCourseResources([]);
      } finally {
        setCourseResourcesLoading(false);
      }
    };

    if (selectedSection) {
      loadCourseResources();
    }
  }, [selectedSection]);

  // Filter only active tasks (not past due) for overview
  const activeTasks = activities.filter(activity => !isOverdue(activity.dueDate));

  // Get task counts by category (only active tasks)
  const getTaskCounts = () => {
    if (activeTasks.length === 0) {
      return {
        quizzes: 0,
        assignments: 0,
        labReports: 0,
        presentations: 0
      };
    }

    return {
      quizzes: activeTasks.filter(a => a.type === 'quiz').length,
      assignments: activeTasks.filter(a => a.type === 'assignment').length,
      labReports: activeTasks.filter(a => a.type === 'lab').length,
      presentations: activeTasks.filter(a => a.type === 'presentation').length
    };
  };

  // Updated workload pressure calculation - Only active tasks
  const getWorkloadPressure = () => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get active tasks due this week (not overdue)
    const thisWeekActivities = activeTasks.filter(activity => {
      const dueDate = new Date(activity.dueDate);
      return dueDate >= now && dueDate <= oneWeekFromNow;
    });

    // Calculate pressure based on different factors
    const dueToday = thisWeekActivities.filter(a => isDueToday(a.dueDate)).length;
    const dueTomorrow = thisWeekActivities.filter(a => {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(a.dueDate).toDateString() === tomorrow.toDateString();
    }).length;
    const totalThisWeek = thisWeekActivities.length;

    // Calculate pressure percentage (0-100%)
    let pressurePercentage = 0;

    // Base pressure from weekly load (max 40%)
    pressurePercentage += Math.min(totalThisWeek * 8, 40);

    // Add pressure from tomorrow's tasks (max 20%)
    pressurePercentage += Math.min(dueTomorrow * 10, 20);

    // Add high pressure from today's tasks (max 40%)
    pressurePercentage += Math.min(dueToday * 20, 40);

    // Cap at 100%
    pressurePercentage = Math.min(pressurePercentage, 100);

    // Determine status text and color based on percentage
    let pressureText, pressureColor, icon;

    if (pressurePercentage <= 20) {
      pressureText = 'Relaxed';
      pressureColor = 'text-green-600';
      icon = Activity;
    } else if (pressurePercentage <= 40) {
      pressureText = 'Light Load';
      pressureColor = 'text-yellow-600';
      icon = Activity;
    } else if (pressurePercentage <= 60) {
      pressureText = 'Moderate';
      pressureColor = 'text-orange-600';
      icon = TrendingUp;
    } else if (pressurePercentage <= 80) {
      pressureText = 'High Pressure';
      pressureColor = 'text-red-600';
      icon = Zap;
    } else {
      pressureText = 'Critical';
      pressureColor = 'text-red-700';
      icon = AlertTriangle;
    }

    return {
      level: pressurePercentage,
      percentage: Math.round(pressurePercentage),
      color: pressureColor,
      text: pressureText,
      icon: icon,
      thisWeekCount: totalThisWeek,
      dueTodayCount: dueToday,
      dueTomorrowCount: dueTomorrow
    };
  };

  // Get upcoming deadlines (next 3 tasks regardless of timeframe)
  const getUpcomingDeadlines = () => {
    const now = new Date();

    return activeTasks
      .filter(activity => {
        const dueDate = new Date(activity.dueDate);
        return dueDate >= now; // Only future tasks
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3); // Only the 3 most upcoming tasks
  };

  // Get polls to display in overview
  const getPollsToDisplay = () => {
    const activePolls = polls.filter(poll => poll.status === 'active');

    // If there are active polls, show them
    if (activePolls.length > 0) {
      return {
        polls: activePolls.slice(0, 3),
        showResults: false,
        hasActive: true
      };
    }

    // If no active polls, show recent closed polls with results
    const recentClosedPolls = polls
      .filter(poll => poll.status === 'closed')
      .slice(0, 3);

    return {
      polls: recentClosedPolls,
      showResults: true,
      hasActive: false
    };
  };

  // Handle create announcement
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
      setShowCreateAnnouncementModal(false);
    }

    return result;
  };

  // Handle create poll
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
      setShowCreatePollModal(false);
    }

    return result;
  };

  // Handle create/update course resources
  // Fixed handleCreateCourseResources function in your OverviewPage
  const handleSubmitCourseResources = async (courseData) => {
    if (!selectedSection) {
      return { success: false, error: 'Please select a section first' };
    }

    try {
      let result;

      if (editingCourse) {
        // EDIT MODE - Use the existing resource ID
        console.log('Editing course resource:', editingCourse.id, courseData);

        result = await courseResourcesService.updateCourseResources({
          resourceId: editingCourse.id,  // Pass the existing resource ID
          sectionId: selectedSection.id,
          crId: userData.uid,
          courseCode: courseData.courseCode,
          courseName: courseData.courseName,
          telegramLink: courseData.telegramLink || '',
          whatsappLink: courseData.whatsappLink || '',
          blcLink: courseData.blcLink || '',
          enrollmentKey: courseData.enrollmentKey || ''
        });
      } else {
        // CREATE MODE - No resourceId for new resource
        console.log('Creating new course resource:', courseData);

        result = await courseResourcesService.updateCourseResources({
          sectionId: selectedSection.id,
          crId: userData.uid,
          courseCode: courseData.courseCode,
          courseName: courseData.courseName,
          telegramLink: courseData.telegramLink || '',
          whatsappLink: courseData.whatsappLink || '',
          blcLink: courseData.blcLink || '',
          enrollmentKey: courseData.enrollmentKey || ''
        });
      }

      if (result.success) {
        // Update local state properly
        setCourseResources(prev => {
          if (editingCourse) {
            // Update existing course in the list
            return prev.map(course =>
              course.id === editingCourse.id
                ? { ...course, ...courseData, updatedAt: new Date().toISOString() }
                : course
            );
          } else {
            // Add new course to the list
            const newCourse = {
              id: result.resource?.id || `${selectedSection.id}_${courseData.courseCode.trim().replace(/\s+/g, '_')}`,
              ...courseData,
              sectionId: selectedSection.id,
              crId: userData.uid,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            return [...prev, newCourse];
          }
        });

        // Close modal and reset state
        setShowCourseResourcesModal(false);
        setEditingCourse(null);

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error submitting course resources:', error);
      return { success: false, error: 'Failed to save course resources' };
    }
  };

  // Open edit course modal
  const openEditCourseModal = (course) => {
    setEditingCourse(course);
    setShowCourseResourcesModal(true);
  };

  // Handle delete course
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course and all its resources? This action cannot be undone.')) {
      const result = await courseResourcesService.deleteCourseResources(courseId);
      if (result.success) {
        setCourseResources(prev => prev.filter(c => c.id !== courseId));
      }
    }
  };

  // Handle announcement click - navigate to announcements page
  const handleAnnouncementClick = (announcement) => {
    // Navigate to announcements page
    onNavigate('announcements');
  };

  const taskCounts = getTaskCounts();
  const upcomingDeadlines = getUpcomingDeadlines();
  const workloadPressure = getWorkloadPressure();
  const pollsDisplay = getPollsToDisplay();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Task Count Cards - Fill Gap with Height Matching */}
<div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

  {/* Left side - 4 Task Cards Container with Full Height */}
  <div className="xl:col-span-2 flex">
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm w-full flex flex-col">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Task Overview</h3>
      
      <div className="grid grid-cols-2 gap-3 sm:gap-4 flex-1">
        {/* Quiz Card - Now fills available height */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all hover:bg-white flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Text and Count */}
            <div className="flex flex-col">
              <p className="text-xl sm:text-2xl font-bold text-blue-600 leading-none">{taskCounts.quizzes}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">Quizzes</p>
            </div>
            
            {/* Right side - Icon */}
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg ml-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Assignment Card - Now fills available height */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all hover:bg-white flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Text and Count */}
            <div className="flex flex-col">
              <p className="text-xl sm:text-2xl font-bold text-orange-600 leading-none">{taskCounts.assignments}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">Assignments</p>
            </div>
            
            {/* Right side - Icon */}
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg ml-2">
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Lab Reports Card - Now fills available height */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all hover:bg-white flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Text and Count */}
            <div className="flex flex-col">
              <p className="text-xl sm:text-2xl font-bold text-green-600 leading-none">{taskCounts.labReports}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 leading-tight">Lab Reports</p>
            </div>
            
            {/* Right side - Icon */}
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg ml-2">
              <FlaskConical className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Presentations Card - Now fills available height */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all hover:bg-white flex items-center">
          <div className="flex items-center justify-between w-full">
            {/* Left side - Text and Count */}
            <div className="flex flex-col">
              <p className="text-xl sm:text-2xl font-bold text-purple-600 leading-none">{taskCounts.presentations}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">Presentations</p>
            </div>
            
            {/* Right side - Icon */}
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg ml-2">
              <Presentation className="h-4 w-4 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    
  {/* Right side - Sections List (unchanged) */}
  <div className="xl:col-span-1 bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
    <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Your Sections</h3>

    {/* Keep all your existing sections code exactly the same */}
    {sections.length ? (
      <div className="space-y-3 sm:space-y-4 max-h-[24rem] sm:max-h-[28rem] overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50">
            {/* All your existing section content */}
            <div className="mb-2 sm:mb-3">
              <h4 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">
                {section.departmentName}
              </h4>
              <p className="text-xs text-gray-600">Batch: {section.batchNumber}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {section.studentCount || 0} students • {section.activityCount || 0} activities
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(section.createdAt, 'short')}
                </span>
              </div>
            </div>

            <div className="mb-2 sm:mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1 sm:mb-2">
                Section Key
              </label>
              <div className="flex items-center justify-between">
                <div className="flex space-x-0.5 sm:space-x-1">
                  {(section.sectionKey || section.id).split('').map((char, index) => (
                    <div
                      key={index}
                      className="w-6 h-7 sm:w-8 sm:h-10 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-center font-mono font-bold text-blue-700 text-xs sm:text-sm shadow-sm"
                    >
                      {char}
                    </div>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(section.sectionKey || section.id);
                  }}
                  title="Copy Section Key"
                  className="ml-2 sm:ml-3 p-1.5 sm:p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors group"
                >
                  <ClipboardIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 group-hover:text-blue-700" />
                </button>
              </div>
            </div>

            {section.crName && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {section.crName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {section.crName}
                    </p>
                    <p className="text-xs text-gray-500">Class Representative</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-6 sm:py-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
        </div>
        <p className="text-xs sm:text-sm text-gray-500">You are not enrolled in any sections.</p>
      </div>
    )}
  </div>
</div>


        {/* Main Content Grid - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* Pressure Card - Mobile Optimized */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                <workloadPressure.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${workloadPressure.color}`} />
                <span className="hidden sm:inline">Workload Pressure</span>
                <span className="sm:hidden">Workload</span>
              </h3>
            </div>

            <div className="mb-4 sm:mb-6">
              <PressureIndicator pressure={workloadPressure.level} />

              <div className="text-center mt-3 sm:mt-4">
                <p className={`text-2xl sm:text-3xl font-bold ${workloadPressure.color}`}>
                  {workloadPressure.percentage}%
                </p>
                <p className={`text-xs sm:text-sm font-medium ${workloadPressure.color}`}>
                  {workloadPressure.text}
                </p>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">This Week:</span>
                <span className="font-medium">{workloadPressure.thisWeekCount} tasks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Today:</span>
                <span className={`font-medium ${workloadPressure.dueTodayCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {workloadPressure.dueTodayCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Tomorrow:</span>
                <span className={`font-medium ${workloadPressure.dueTomorrowCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {workloadPressure.dueTomorrowCount}
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines - Mobile Optimized */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                <span className="hidden sm:inline">Upcoming Deadlines</span>
                <span className="sm:hidden">Deadlines</span>
              </h3>
              <button
                onClick={() => onNavigate('activities')}
                className="text-blue-600 text-xs sm:text-sm hover:text-blue-700"
              >
                View All
              </button>
            </div>

            {activitiesLoading ? (
              <div className="text-center py-3 sm:py-4">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : upcomingDeadlines.length > 0 ? (
              <div className="space-y-2">
                {upcomingDeadlines.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg min-h-[3rem] sm:min-h-[4rem]">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm truncate leading-tight">{activity.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{activity.type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${isDueToday(activity.dueDate) ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {formatDate(activity.dueDate, 'short')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isDueToday(activity.dueDate) ? 'Due Today' : formatDate(activity.dueDate, 'relative')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">No upcoming deadlines</p>
              </div>
            )}
          </div>

          {/* Announcements Card - Mobile Optimized */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <span className="hidden sm:inline">Announcements</span>
                <span className="sm:hidden">News</span>
              </h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Show create button for CRs - Mobile Optimized */}
                {isCR && selectedSection && (
                  <button
                    onClick={() => setShowCreateAnnouncementModal(true)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Create announcement"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
                <button
                  onClick={() => onNavigate('announcements')}
                  className="text-blue-600 text-xs sm:text-sm hover:text-blue-700"
                >
                  View All
                </button>
              </div>
            </div>

            {announcementsLoading ? (
              <div className="text-center py-3 sm:py-4">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-2">
                {announcements.slice(0, 3).map((announcement) => (
                  <div
                    key={announcement.id}
                    onClick={() => handleAnnouncementClick(announcement)}
                    className="p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors min-h-[3rem] sm:min-h-[4rem]"
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate leading-tight">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {announcement.content.substring(0, 30)}...
                        </p>
                      </div>

                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <div className="flex items-center space-x-1">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getPriorityColor(announcement.priority)}`}></div>
                          <span className="text-xs text-gray-500">
                            {formatDate(announcement.createdAt, 'short')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">No announcements yet</p>
                {isCR && selectedSection && (
                  <button
                    onClick={() => setShowCreateAnnouncementModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Create first announcement
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Polls & Surveys Card - Mobile Optimized */}
          <div className="bg-white rounded-lg p-4 sm:p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2 text-sm sm:text-base">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <span className="hidden sm:inline">Polls & Surveys</span>
                <span className="sm:hidden">Polls</span>
              </h3>
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Show create button for CRs - Mobile Optimized */}
                {isCR && selectedSection && (
                  <button
                    onClick={() => setShowCreatePollModal(true)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Create poll"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
                <button
                  onClick={() => onNavigate('polls')}
                  className="text-blue-600 text-xs sm:text-sm hover:text-blue-700"
                >
                  View All
                </button>
              </div>
            </div>

            {pollsLoading ? (
              <div className="text-center py-3 sm:py-4">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : pollsDisplay.polls.length > 0 ? (
              <div className="space-y-2">
                {pollsDisplay.polls.map((poll) => (
                  <div
                    key={poll.id}
                    onClick={() => onNavigate('polls')}
                    className="p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors min-h-[3rem] sm:min-h-[4rem]"
                  >
                    <div className="flex items-center justify-between h-full">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate leading-tight">
                          {poll.question.substring(0, 25)}...
                        </p>
                        {pollsDisplay.showResults && poll.totalResponses > 0 ? (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">{poll.options[0]?.text.substring(0, 15)}...</span>
                            <span className="text-gray-500"> (Top choice)</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {poll.totalResponses || 0} responses
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${poll.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                          {poll.status === 'active' ? 'Active' : 'Closed'}
                        </span>

                        {poll.status === 'active' && !isCR && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('polls');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                          >
                            Vote
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-500">No polls yet</p>
                {isCR && selectedSection && (
                  <button
                    onClick={() => setShowCreatePollModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    Create first poll
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Course Resources Section - Mobile Responsive Table */}
        {selectedSection && (
          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Important Links</h3>
              {isCR && (
                <button
                  onClick={() => setShowCourseResourcesModal(true)}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Course</span>
                  <span className="sm:hidden">Add</span>
                </button>
              )}
            </div>

            {courseResourcesLoading ? (
              <div className="text-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : courseResources.length === 0 ? (
              <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  {isCR ? 'Add course resources to help students access important links' : 'No course resources available yet'}
                </p>
                {isCR && (
                  <button
                    onClick={() => setShowCourseResourcesModal(true)}
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Add First Course
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {courseResources.map((course) => (
                      <CourseResourceRow
                        key={course.id}
                        course={course}
                        isCR={isCR}
                        onEdit={() => openEditCourseModal(course)}
                        onDelete={() => handleDeleteCourse(course.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* Empty State for No Active Activities */}
        {activeTasks.length === 0 && !activitiesLoading && (
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isCR ? 'Ready to Create Activities?' : 'No Active Tasks'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isCR
                ? "Create assignments, quizzes, and tasks for your students"
                : "No active tasks right now. Check back for new assignments!"
              }
            </p>
            {isCR && (
              <button
                onClick={() => onNavigate('activities')}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Task
              </button>
            )}
          </div>
        )}

        {/* Create Announcement Modal */}
        {isCR && selectedSection && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncementModal}
            onClose={() => setShowCreateAnnouncementModal(false)}
            onSubmit={handleCreateAnnouncement}
            sectionId={selectedSection.id}
          />
        )}

        {/* Create Poll Modal */}
        {isCR && selectedSection && (
          <CreatePollModal
            isOpen={showCreatePollModal}
            onClose={() => setShowCreatePollModal(false)}
            onSubmit={handleCreatePoll}
            sectionId={selectedSection.id}
          />
        )}

        {/* Course Resources Modal */}
        {isCR && selectedSection && (
          <CourseResourcesModal
            isOpen={showCourseResourcesModal}
            onClose={() => {
              setShowCourseResourcesModal(false);
              setEditingCourse(null);
            }}
            onSubmit={handleSubmitCourseResources}
            sectionId={selectedSection.id}
            initialData={editingCourse}
          />
        )}
      </div>
    </div>
  );
};

export default OverviewPage;