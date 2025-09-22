// src/components/dashboard/CourseResources/CourseResourcesModal.jsx - Better UI with single field
import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy } from 'lucide-react';

const CourseResourcesModal = ({ isOpen, onClose, onSubmit, sectionId, initialData = null }) => {
  const [formData, setFormData] = useState({
    courseName: '',
    telegramLink: '',
    whatsappLink: '',
    blcLink: '',
    enrollmentKey: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        courseName: initialData.courseName || '',
        telegramLink: initialData.telegramLink || '',
        whatsappLink: initialData.whatsappLink || '',
        blcLink: initialData.blcLink || '',
        enrollmentKey: initialData.enrollmentKey || ''
      });
    } else {
      setFormData({
        courseName: '',
        telegramLink: '',
        whatsappLink: '',
        blcLink: '',
        enrollmentKey: ''
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.courseName.trim()) {
      setError('Please enter course name');
      return;
    }

    setLoading(true);
    try {
      const result = await onSubmit({
        courseCode: formData.courseName, // Use course name as code too
        courseName: formData.courseName,
        telegramLink: formData.telegramLink,
        whatsappLink: formData.whatsappLink,
        blcLink: formData.blcLink,
        enrollmentKey: formData.enrollmentKey
      });
      if (result.success) {
        setFormData({
          courseName: '',
          telegramLink: '',
          whatsappLink: '',
          blcLink: '',
          enrollmentKey: ''
        });
      } else {
        setError(result.error || 'Failed to save course');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      courseName: '',
      telegramLink: '',
      whatsappLink: '',
      blcLink: '',
      enrollmentKey: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Course' : 'Add Course'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Course Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name *
            </label>
            <input
              type="text"
              value={formData.courseName}
              onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              placeholder="e.g., CSE211 - Object Oriented Programming"
              disabled={loading}
            />
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Resources (Optional)</h3>
            
            {/* Telegram */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"/>
                </svg>
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.telegramLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegramLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://t.me/..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
                </svg>
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.whatsappLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://chat.whatsapp.com/..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* BLC */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">BLC</span>
              </div>
              <div className="flex-1">
                <input
                  type="url"
                  value={formData.blcLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, blcLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://blc.edu.bd/..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Enrollment Key */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.enrollmentKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, enrollmentKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter enrollment key"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (initialData ? 'Update Course' : 'Add Course')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseResourcesModal;
