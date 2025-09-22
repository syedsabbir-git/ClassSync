// src/components/dashboard/Activities/ActivityCard.jsx - Updated icon mapping
import React from 'react';
import { 
  Clock, 
  User, 
  Edit3, 
  Trash2, 
  Eye, 
  FileText, 
  HelpCircle, 
  FlaskConical, 
  Presentation, // Fixed: Changed from Monitor to Presentation
  Calendar,
  AlertTriangle
} from 'lucide-react';
import PriorityBadge from '../Shared/PriorityBadge';
import { formatDate, formatTime, isOverdue, isDueToday, getTimeUntilDue } from '../../../utils/dashboard/dateUtils';
import { calculateActivityPriority, ACTIVITY_TYPES } from '../../../utils/dashboard/priorityUtils';

const ActivityCard = ({ activity, isCR, onEdit, onDelete, onView }) => {
  const priority = calculateActivityPriority(activity);
  const typeConfig = ACTIVITY_TYPES[activity.type];
  
  const getTypeIcon = () => {
    switch (typeConfig.icon) {
      case 'FileText': return FileText;
      case 'HelpCircle': return HelpCircle;
      case 'FlaskConical': return FlaskConical;
      case 'Presentation': return Presentation; // Fixed: Changed from Monitor to Presentation
      default: return FileText;
    }
  };
  
  const TypeIcon = getTypeIcon();
  
  const isActivityOverdue = isOverdue(activity.dueDate);
  const isActivityDueToday = isDueToday(activity.dueDate);

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${
      isActivityOverdue ? 'bg-red-50 border-l-4 border-red-500' : 
      isActivityDueToday ? 'bg-orange-50 border-l-4 border-orange-500' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start space-x-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${typeConfig.color}-100`}>
              <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-600`} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {activity.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span className="capitalize">{activity.type}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>{activity.points} points</span>
                    </span>
                    {isCR && (
                      <span className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{activity.submissionCount || 0} submissions</span>
                      </span>
                    )}
                  </div>
                </div>
                <PriorityBadge priority={priority} />
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-700 mb-3 line-clamp-2">
            {activity.description}
          </p>

          {/* Due Date and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <div className={`flex items-center space-x-1 ${
                isActivityOverdue ? 'text-red-600' : 
                isActivityDueToday ? 'text-orange-600' : 'text-gray-600'
              }`}>
                <Calendar className="h-4 w-4" />
                <span>Due {formatDate(activity.dueDate, 'relative')}</span>
                {(isActivityOverdue || isActivityDueToday) && (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{formatTime(activity.dueDate)}</span>
              </div>
              <div className="text-gray-500">
                <span>{getTimeUntilDue(activity.dueDate)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onView(activity.id)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </button>
              
              {isCR && (
                <>
                  <button
                    onClick={() => onEdit(activity.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit activity"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(activity.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete activity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Instructions Preview */}
          {activity.instructions && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 line-clamp-2">
                <span className="font-medium">Instructions: </span>
                {activity.instructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
