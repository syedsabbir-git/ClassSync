// src/components/dashboard/Calendar/CalendarPage.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useActivities } from '../../../hooks/dashboard/useActivities';
import sectionService from '../../../services/sectionService';
import LoadingSpinner from '../Shared/LoadingSpinner';
import EmptyState from '../Shared/EmptyState';
import PriorityBadge from '../Shared/PriorityBadge';
import { formatDate, isDueToday, isOverdue } from '../../../utils/dashboard/dateUtils';
import { calculateActivityPriority } from '../../../utils/dashboard/priorityUtils';

const CalendarPage = () => {
  const { userData, userRole } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week'
  const [loading, setLoading] = useState(true);
  
  const isCR = userRole === 'cr';
  
  // Use activities hook for selected section
  const { activities, loading: activitiesLoading } = useActivities(selectedSection?.id);

  // Load sections
  useEffect(() => {
    const loadSections = async () => {
      if (!userData) return;
      
      setLoading(true);
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

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getActivitiesForDate = (date) => {
    if (!date) return [];
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.dueDate);
      return activityDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  if (loading) {
    return <LoadingSpinner message="Loading calendar..." />;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6">

      {/* Section Selector */}
      {sections.length > 1 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
          <select
            value={selectedSection?.id || ''}
            onChange={(e) => {
              const section = sections.find(s => s.id === e.target.value);
              setSelectedSection(section);
            }}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.departmentName} - {section.batchNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedSection && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {activitiesLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading activities...</p>
            </div>
          ) : (
            <>
              {/* Day Names Header */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {dayNames.map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {days.map((day, index) => {
                  const dayActivities = day ? getActivitiesForDate(day) : [];
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day && day.getMonth() === currentDate.getMonth();
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      {day && (
                        <>
                          <div className={`text-right mb-2 ${
                            isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
                          }`}>
                            {isToday && (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm rounded-full">
                                {day.getDate()}
                              </span>
                            )}
                            {!isToday && day.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayActivities.slice(0, 3).map((activity) => {
                              const priority = calculateActivityPriority(activity);
                              const isActivityOverdue = isOverdue(activity.dueDate);
                              
                              return (
                                <div
                                  key={activity.id}
                                  className={`text-xs p-1 rounded text-white truncate cursor-pointer ${
                                    isActivityOverdue ? 'bg-red-500' :
                                    priority.value === 4 ? 'bg-red-400' :
                                    priority.value === 3 ? 'bg-orange-400' :
                                    priority.value === 2 ? 'bg-yellow-500' : 'bg-green-400'
                                  }`}
                                  title={`${activity.title} - ${activity.type}`}
                                >
                                  {activity.title}
                                </div>
                              );
                            })}
                            {dayActivities.length > 3 && (
                              <div className="text-xs text-gray-500 text-center">
                                +{dayActivities.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Upcoming Activities Sidebar */}
      {selectedSection && activities.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Activities</h3>
          <div className="space-y-3">
            {activities
              .filter(activity => new Date(activity.dueDate) >= new Date())
              .slice(0, 5)
              .map((activity) => {
                const priority = calculateActivityPriority(activity);
                
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(activity.dueDate, 'short')}</span>
                        <span>•</span>
                        <span className="capitalize">{activity.type}</span>
                      </div>
                    </div>
                    <PriorityBadge priority={priority} size="xs" />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedSection && activities.length === 0 && !activitiesLoading && (
        <div className="bg-white rounded-xl p-12 border border-gray-200">
          <EmptyState
            icon={Calendar}
            title="No activities scheduled"
            description={isCR ? "Create activities to see them on the calendar" : "No activities have been scheduled yet"}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
