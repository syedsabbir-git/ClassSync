// src/components/dashboard/Activities/EditActivityModal.jsx - New edit modal
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertCircle,
  Link,
  MapPin 
} from 'lucide-react';

const EditActivityModal = ({ isOpen, onClose, onSubmit, activity, sectionId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'assignment',
    dueDate: '',
    dueTime: '23:59',
    submissionType: 'physical',
    submissionLink: '',
    submissionLocation: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Populate form with activity data when modal opens
  useEffect(() => {
    if (activity && isOpen) {
      const dueDate = new Date(activity.dueDate);
      const dueDateString = dueDate.toISOString().split('T')[0];
      const dueTimeString = dueDate.toTimeString().slice(0, 5);

      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        type: activity.type || 'assignment',
        dueDate: dueDateString,
        dueTime: dueTimeString,
        submissionType: activity.submissionType || 'physical',
        submissionLink: activity.submissionLink || '',
        submissionLocation: activity.submissionLocation || ''
      });
    }
  }, [activity, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation with proper null/undefined checks
    const newErrors = {};
    
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    
    if (formData.submissionType === 'online') {
      if (!formData.submissionLink || !formData.submissionLink.trim()) {
        newErrors.submissionLink = 'Submission link is required for online submissions';
      }
    }
    
    if (formData.submissionType === 'physical') {
      if (!formData.submissionLocation || !formData.submissionLocation.trim()) {
        newErrors.submissionLocation = 'Submission location is required for physical submissions';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    
    try {
      // Combine date and time
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      
      // Create update data
      const updateData = {
        title: (formData.title || '').trim(),
        description: (formData.description || '').trim(),
        type: formData.type || 'assignment',
        dueDate: dueDateTime.toISOString(),
        submissionType: formData.submissionType || 'physical',
        submissionLink: formData.submissionType === 'online' ? (formData.submissionLink || '').trim() : null,
        submissionLocation: formData.submissionType === 'physical' ? (formData.submissionLocation || '').trim() : null,
      };

      const result = await onSubmit(activity.id, updateData);
      
      if (result.success) {
        setErrors({});
        onClose();
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setErrors({ submit: 'Failed to update activity. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes with null checks
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={formData.type || 'assignment'}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="lab">Lab Report</option>
              <option value="presentation">Presentation</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the task requirements..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={formData.dueTime || '23:59'}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Clock className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Submission Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Submission Method
            </label>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="edit-physical"
                  name="submissionType"
                  value="physical"
                  checked={formData.submissionType === 'physical'}
                  onChange={(e) => handleInputChange('submissionType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="edit-physical" className="ml-3 flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">Physical Submission</span>
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="edit-online"
                  name="submissionType"
                  value="online"
                  checked={formData.submissionType === 'online'}
                  onChange={(e) => handleInputChange('submissionType', e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="edit-online" className="ml-3 flex items-center">
                  <Link className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">Online Submission</span>
                </label>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          {formData.submissionType === 'online' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Link *
              </label>
              <input
                type="url"
                value={formData.submissionLink || ''}
                onChange={(e) => handleInputChange('submissionLink', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.submissionLink ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://forms.google.com/... or https://classroom.google.com/..."
              />
              {errors.submissionLink && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.submissionLink}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Location *
              </label>
              <input
                type="text"
                value={formData.submissionLocation || ''}
                onChange={(e) => handleInputChange('submissionLocation', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.submissionLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Teacher's desk, Office room 301, Lab instructor"
              />
              {errors.submissionLocation && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.submissionLocation}
                </p>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivityModal;
