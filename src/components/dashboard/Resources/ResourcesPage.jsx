// src/components/dashboard/Resources/ResourcesPage.jsx - Global Access
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Menu,
  ChevronDown,
  X,
  Globe
} from 'lucide-react';
import ResourceCard from './ResourceCard';
import UploadResourceModal from './UploadResourceModal';
import resourceService from '../../../services/resourceService';

const ResourcesPage = ({ onNavigate }) => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    course: '',
    topic: '',
    type: ''
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    courses: [],
    topics: []
  });
  
  // Mobile filter state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load all resources globally (no section barrier)
  const loadResources = async () => {
    setLoading(true);
    try {
      const result = await resourceService.getResources();
      if (result.success) {
        setResources(result.resources);
        setFilteredResources(result.resources);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load filter options from existing resources
  const loadFilterOptions = async () => {
    try {
      const result = await resourceService.getFilterOptions();
      if (result.success) {
        setFilterOptions({
          courses: result.courses,
          topics: result.topics
        });
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Initial load
  useEffect(() => {
    loadResources();
    loadFilterOptions();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...resources];

    // Apply text search (searches across multiple fields)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchLower) ||
        resource.course.toLowerCase().includes(searchLower) ||
        resource.topic.toLowerCase().includes(searchLower) ||
        resource.username.toLowerCase().includes(searchLower)
      );
    }

    // Apply course filter (partial match for custom input)
    if (filters.course) {
      filtered = filtered.filter(resource => 
        resource.course.toLowerCase().includes(filters.course.toLowerCase())
      );
    }

    // Apply topic filter (partial match for custom input)
    if (filters.topic) {
      filtered = filtered.filter(resource => 
        resource.topic.toLowerCase().includes(filters.topic.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter(resource => resource.type === filters.type);
    }

    setFilteredResources(filtered);
  }, [resources, searchTerm, filters]);

  // Handle successful upload
  const handleUploadSuccess = () => {
    loadResources();
    loadFilterOptions();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ course: '', topic: '', type: '' });
    setSearchTerm('');
  };

  // Check if filters are active
  const hasActiveFilters = filters.course || filters.topic || filters.type || searchTerm;

  const resourceTypes = [
    { value: 'youtube', label: 'YouTube' },
    { value: 'drive', label: 'Google Drive' },
    { value: 'link', label: 'External Link' },
    { value: 'pdf', label: 'PDF Document' }
  ];

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
               
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Resource
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources, courses, topics, or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Desktop Filters */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-4">
            
            {/* Course Filter (Datalist for suggestions) */}
            <div className="relative">
              <input
                type="text"
                list="courses"
                placeholder="Filter by course..."
                value={filters.course}
                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <datalist id="courses">
                {filterOptions.courses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </datalist>
            </div>

            {/* Topic Filter (Datalist for suggestions) */}
            <div className="relative">
              <input
                type="text"
                list="topics"
                placeholder="Filter by topic..."
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <datalist id="topics">
                {filterOptions.topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </datalist>
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">All Types</option>
              {resourceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Filters
            </button>
          </div>

          {/* Mobile Filter Toggle */}
          <div className="sm:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Filters */}
            {showMobileFilters && (
              <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
                
                {/* Course Filter */}
                <input
                  type="text"
                  list="courses-mobile"
                  placeholder="Filter by course..."
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <datalist id="courses-mobile">
                  {filterOptions.courses.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </datalist>

                {/* Topic Filter */}
                <input
                  type="text"
                  list="topics-mobile"
                  placeholder="Filter by topic..."
                  value={filters.topic}
                  onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <datalist id="topics-mobile">
                  {filterOptions.topics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </datalist>

                {/* Type Filter */}
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">All Types</option>
                  {resourceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className="w-full px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {loading ? 'Loading...' : `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found globally`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <X className="h-3 w-3" />
              <span>Clear filters</span>
            </button>
          )}
        </div>

        {/* Resources Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading resources...</span>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No matching resources found' : 'No resources yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for'
                : 'Be the first to share an educational resource with the global community'
              }
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              {hasActiveFilters ? 'Upload Resource' : 'Upload First Resource'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {/* Upload Modal */}
        <UploadResourceModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      </div>
    </div>
  );
};

export default ResourcesPage;
