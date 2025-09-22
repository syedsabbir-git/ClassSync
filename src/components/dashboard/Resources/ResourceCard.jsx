// src/components/dashboard/Resources/ResourceCard.jsx
import React, { useState } from 'react';
import { 
  ExternalLink, 
  FileText, 
  Youtube, 
  HardDrive, 
  User, 
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { formatDate } from '../../../utils/dashboard/dateUtils';
import resourceService from '../../../services/resourceService';

const ResourceCard = ({ resource }) => {
  const [imageError, setImageError] = useState(false);

  const getResourceIcon = () => {
    switch (resource.type) {
      case 'youtube':
        return <Youtube className="h-8 w-8 text-red-600" />;
      case 'drive':
        return <HardDrive className="h-8 w-8 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-orange-600" />;
      default:
        return <LinkIcon className="h-8 w-8 text-green-600" />;
    }
  };

  const getThumbnail = () => {
    // YouTube - Auto extract thumbnail
    if (resource.type === 'youtube' && !imageError) {
      const thumbnail = resourceService.getYouTubeThumbnail(resource.url);
      if (thumbnail) {
        return (
          <img
            src={thumbnail}
            alt={resource.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        );
      }
    }
    
    // External links - Show favicon
    if (resource.type === 'link' && !imageError) {
      const favicon = resourceService.getFaviconUrl(resource.url);
      if (favicon) {
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <img
              src={favicon}
              alt="Website favicon"
              className="w-12 h-12 object-contain"
              onError={() => setImageError(true)}
            />
          </div>
        );
      }
    }
    
    // Fallback - Show icon
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        {getResourceIcon()}
      </div>
    );
  };

  const handleClick = () => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const getTypeLabel = () => {
    switch (resource.type) {
      case 'youtube': return 'YouTube';
      case 'drive': return 'Google Drive';
      case 'pdf': return 'PDF Document';
      default: return 'External Link';
    }
  };

  const getTypeColor = () => {
    switch (resource.type) {
      case 'youtube': return 'bg-red-100 text-red-700';
      case 'drive': return 'bg-blue-100 text-blue-700';
      case 'pdf': return 'bg-orange-100 text-orange-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden"
    >
      
      {/* Thumbnail */}
      <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
        {getThumbnail()}
        
        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor()}`}>
            {getTypeLabel()}
          </span>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        
        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
          {resource.title}
        </h3>

        {/* Course and Topic */}
        <div className="space-y-1 mb-3">
          <div className="text-sm font-medium text-blue-600">
            {resource.course}
          </div>
          <div className="text-sm text-gray-600">
            {resource.topic}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1 min-w-0 flex-1">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resource.username}</span>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(resource.created_at, 'short')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
