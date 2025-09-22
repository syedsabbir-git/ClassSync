// src/services/resourceService.js
import { supabase } from '../config/supabase';

const resourceService = {
  // Upload PDF to Supabase Storage (10MB limit)
  async uploadPDF(file, filename) {
    try {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, error: 'File size must be less than 10MB' };
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${filename.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      const filePath = `pdfs/${Date.now()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from('resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Upload PDF error:', error);
      return { success: false, error: 'Failed to upload PDF' };
    }
  },

  // Create new resource
  async createResource(resourceData) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([resourceData])
        .select()
        .single();

      if (error) {
        console.error('Create resource error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, resource: data };
    } catch (error) {
      console.error('Create resource error:', error);
      return { success: false, error: 'Failed to create resource' };
    }
  },

  // Get all resources globally with filtering and sorting
  async getResources(filters = {}) {
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.course) {
        query = query.ilike('course', `%${filters.course}%`);
      }
      if (filters.topic) {
        query = query.ilike('topic', `%${filters.topic}%`);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Get resources error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, resources: data || [] };
    } catch (error) {
      console.error('Get resources error:', error);
      return { success: false, error: 'Failed to fetch resources' };
    }
  },

  // Get unique courses and topics for filters (from custom user input)
  async getFilterOptions() {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('course, topic');

      if (error) {
        console.error('Get filter options error:', error);
        return { success: false, error: error.message };
      }

      const courses = [...new Set(data.map(item => item.course))].sort();
      const topics = [...new Set(data.map(item => item.topic))].sort();

      return { success: true, courses, topics };
    } catch (error) {
      console.error('Get filter options error:', error);
      return { success: false, error: 'Failed to fetch filter options' };
    }
  },

  // Extract YouTube video ID from URL (supports multiple formats)
  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  },

  // Get YouTube thumbnail URL automatically
  getYouTubeThumbnail(url) {
    const videoId = this.extractYouTubeId(url);
    if (videoId) {
      // Use maxresdefault for better quality, fallback to mqdefault
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
  },

  // Validate YouTube URL
  isValidYouTubeUrl(url) {
    return this.extractYouTubeId(url) !== null;
  },

  // Get favicon for external links
  getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return null;
    }
  }
};

export default resourceService;
