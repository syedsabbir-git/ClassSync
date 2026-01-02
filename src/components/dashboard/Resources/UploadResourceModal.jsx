// src/components/dashboard/Resources/UploadResourceModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Link, 
  FileText, 
  Youtube, 
  HardDrive,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import resourceService from '../../../services/resourceService';

const UploadResourceModal = ({ isOpen, onClose, onSuccess }) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    course: '',
    type: 'link',
    url: '',
    file: null
  });

  const resourceTypes = [
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
    { value: 'drive', label: 'Google Drive', icon: HardDrive, color: 'text-blue-600' },
    { value: 'link', label: 'External Link', icon: Link, color: 'text-green-600' },
    { value: 'pdf', label: 'PDF Document', icon: FileText, color: 'text-orange-600' }
  ];

  const validateForm = () => {
    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.course.trim()) {
      setError('Course is required');
      return false;
    }
    if (!formData.topic.trim()) {
      setError('Topic is required');
      return false;
    }

    // Type-specific validation
    if (formData.type === 'pdf') {
      if (!formData.file) {
        setError('Please select a PDF file');
        return false;
      }
      if (formData.file.type !== 'application/pdf') {
        setError('Please select a valid PDF file');
        return false;
      }
      if (formData.file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('PDF file size must be less than 10MB');
        return false;
      }
    } else {
      if (!formData.url.trim()) {
        setError('URL is required');
        return false;
      }
      
      // Validate URL format
      try {
        new URL(formData.url);
      } catch {
        setError('Please enter a valid URL');
        return false;
      }

      // YouTube specific validation
      if (formData.type === 'youtube') {
        if (!resourceService.isValidYouTubeUrl(formData.url)) {
          setError('Please enter a valid YouTube URL');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userData?.name) {
      setError('User information not available');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let finalUrl = formData.url;

      // Handle PDF upload
      if (formData.type === 'pdf') {
        const uploadResult = await resourceService.uploadPDF(formData.file, formData.title);
        if (!uploadResult.success) {
          setError(uploadResult.error);
          setLoading(false);
          return;
        }
        finalUrl = uploadResult.url;
      }

      // Create resource
      const resourceData = {
        title: formData.title.trim(),
        topic: formData.topic.trim(),
        course: formData.course.trim(),
        type: formData.type,
        file_url: finalUrl,
        filename: formData.file?.name || formData.title,
        file_size: formData.file?.size,
        username: userData.name
      };

      const result = await resourceService.createResource(resourceData);

      if (result.success) {
        setSuccess('Resource uploaded successfully!');
        setTimeout(() => {
          onSuccess && onSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        topic: '',
        course: '',
        type: 'link',
        url: '',
        file: null
      });
      setError('');
      setSuccess('');
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size immediately
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        e.target.value = '';
        return;
      }
      setFormData({ ...formData, file });
      setError('');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upload Resource</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter resource title"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>

            {/* Course (Custom Input) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course *
              </label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Computer Science, Mathematics, Physics"
                required
                disabled={loading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">Enter the course name (custom input)</p>
            </div>

            {/* Topic (Custom Input) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Data Structures, Calculus, Quantum Mechanics"
                required
                disabled={loading}
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">Enter the specific topic (custom input)</p>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {resourceTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value, url: '', file: null })}
                      disabled={loading}
                      className={`flex items-center space-x-2 p-3 border rounded-lg transition-colors text-sm ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className={`h-4 w-4 ${formData.type === type.value ? 'text-blue-600' : type.color}`} />
                      <span className="font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* URL Input (for non-PDF types) */}
            {formData.type !== 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'youtube' ? 'YouTube URL' : 
                   formData.type === 'drive' ? 'Google Drive Link' : 'URL'} *
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder={
                    formData.type === 'youtube' ? 'https://www.youtube.com/watch?v=... or https://youtu.be/...' :
                    formData.type === 'drive' ? 'https://drive.google.com/...' :
                    'https://example.com'
                  }
                  required
                  disabled={loading}
                />
                {formData.type === 'youtube' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Supports YouTube video and playlist URLs. Thumbnail will be extracted automatically.
                  </p>
                )}
              </div>
            )}

            {/* PDF File Input */}
            {formData.type === 'pdf' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PDF File * (Max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                  disabled={loading}
                />
                {formData.file && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border text-xs text-gray-600">
                    <strong>Selected:</strong> {formData.file.name} ({formatFileSize(formData.file.size)})
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload PDF documents up to 10MB. File will be stored securely and publicly accessible.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadResourceModal;
