// src/pages/CreateSection.jsx - Complete Section Creation with Firebase Integration

import React, { useState } from 'react';
import { Users, BookOpen, ArrowRight, Loader, CheckCircle, Copy, LogOut } from 'lucide-react';
import sectionService from '../services/sectionService';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const CreateSection = ({ onSectionCreated }) => {
  const [formData, setFormData] = useState({
    departmentName: '',
    batchNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSection, setCreatedSection] = useState(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const { userData } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.departmentName.trim() || !formData.batchNumber.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await sectionService.createSection({
        crId: userData.uid,
        crName: userData.name,
        departmentName: formData.departmentName.trim(),
        batchNumber: formData.batchNumber.trim()
      });

      if (result.success) {
        setCreatedSection(result);
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          onSectionCreated && onSectionCreated(result.sectionData);
        }, 3000);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Error creating section:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Success screen after section creation
  if (createdSection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Section Created Successfully!</h1>
          <p className="text-gray-600 mb-6">Share this section key with your students to let them join your section.</p>
          
          {/* Section Key Display */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6 border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-600 mb-2">Section Key</p>
            <div className="flex items-center justify-center space-x-3">
              <span className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                {createdSection.sectionKey}
              </span>
              <button
                onClick={() => copyToClipboard(createdSection.sectionKey)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                title="Copy section key"
              >
                <Copy className="w-6 h-6" />
              </button>
            </div>
            {keyCopied && (
              <p className="text-sm text-green-600 mt-2 font-medium">✓ Copied to clipboard!</p>
            )}
          </div>

          {/* Section Details */}
          <div className="bg-blue-50 p-4 rounded-xl mb-6 text-left border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Section Details:</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Department:</span> {createdSection.sectionData.departmentName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Batch:</span> {createdSection.sectionData.batchNumber}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Class Rep:</span> {createdSection.sectionData.crName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Created:</span> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-purple-50 p-4 rounded-xl mb-6 text-left border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-800 mb-2">Next Steps:</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>1. Share the section key with your students</li>
              <li>2. Students will use this key to enroll</li>
              <li>3. Start managing class activities from your dashboard</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mb-4">Redirecting to dashboard in 3 seconds...</p>
          
          <button
            onClick={() => onSectionCreated && onSectionCreated(createdSection.sectionData)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Section creation form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">ClassSync</h1>
              <span className="text-sm text-gray-500">Class Representative</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Welcome, {userData?.name}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
          {/* Form Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Your Section</h1>
            <p className="text-gray-600">Set up a new section to start managing class activities</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="e.g., Computer Science & Engineering"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Enter the full department name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Number *
              </label>
              <input
                type="text"
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleInputChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="e.g., Spring 2024, Batch 57, Fall 2023"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">Enter the batch or semester information</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Creating Section...</span>
                </>
              ) : (
                <>
                  <span>Create Section</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Information Box */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-800 mb-2">📝 What happens next?</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• You'll receive a unique 8-character section key</li>
              <li>• Share this key with your students for enrollment</li>
              <li>• Students will use the key to join your section</li>
              <li>• You can then manage activities from your dashboard</li>
            </ul>
          </div>

          {/* User Info */}
          {userData && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                Creating section as: <span className="font-medium">{userData.name}</span>
              </p>
              <p className="text-xs text-gray-500">{userData.email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSection;