/**
 * Centralized API configuration
 * Use these constants instead of hardcoding URLs
 */

// Node.js backend API (port 5000)
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Python Flask API (port 5001)
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5001';

/**
 * API endpoint builders
 */
export const endpoints = {
  // Auth endpoints
  auth: {
    login: `${API_URL}/api/auth/login`,
    signup: `${API_URL}/api/auth/signup`,
    logout: `${API_URL}/api/auth/logout`,
    refresh: `${API_URL}/api/auth/refresh`,
    verifyEmail: `${API_URL}/api/auth/verify-email`,
    forgotPassword: `${API_URL}/api/auth/forgot-password`,
    resetPassword: `${API_URL}/api/auth/reset-password`,
  },

  // Video endpoints
  videos: {
    myVideos: `${API_URL}/api/videos/my-videos`,
    saveProcessed: `${API_URL}/api/videos/save-processed`,
    getById: (id) => `${API_URL}/api/videos/${id}`,
    update: (id) => `${API_URL}/api/videos/${id}`,
    delete: (id) => `${API_URL}/api/videos/${id}`,
  },

  // Clip endpoints
  clips: {
    myClips: `${API_URL}/api/clips/my-clips`,
    getById: (id) => `${API_URL}/api/clips/${id}`,
    update: (id) => `${API_URL}/api/clips/${id}`,
    delete: (id) => `${API_URL}/api/clips/${id}`,
  },

  // Post endpoints
  posts: {
    myPosts: `${API_URL}/api/post/my-posts`,
    postToYouTube: `${API_URL}/api/post/youtube`,
    scheduled: `${API_URL}/api/post/scheduled`,
    cancelScheduled: (id) => `${API_URL}/api/post/scheduled/${id}/cancel`,
  },

  // Analytics endpoints
  analytics: {
    overview: `${API_URL}/api/analytics/overview`,
    timeseries: (days) => `${API_URL}/api/analytics/timeseries?days=${days}`,
    topClips: (limit) => `${API_URL}/api/analytics/top-clips?limit=${limit}`,
    platform: `${API_URL}/api/analytics/platform`,
    sync: `${API_URL}/api/analytics/sync`,
    export: (format) => `${API_URL}/api/analytics/export?format=${format}`,
    aiInsights: `${API_URL}/api/analytics/ai-insights`,
    viralScoreAccuracy: `${API_URL}/api/analytics/viral-score-accuracy`,
  },

  // AI endpoints
  ai: {
    generateCaption: `${API_URL}/api/ai/generate-caption`,
  },

  // Platform connection endpoints
  platform: {
    connections: `${API_URL}/api/platform/connections`,
    youtubeAuth: `${API_URL}/api/platform/youtube/auth`,
    instagramAuth: `${API_URL}/api/platform/instagram/auth`,
    disconnect: (platform) => `${API_URL}/api/platform/${platform}/disconnect`,
  },

  // Python API endpoints (video processing)
  python: {
    download: `${PYTHON_API_URL}/download`,
    upload: `${PYTHON_API_URL}/upload`,
    process: `${PYTHON_API_URL}/process`,
    progress: (videoId) => `${PYTHON_API_URL}/progress/${videoId}`,
    video: (filename) => `${PYTHON_API_URL}/video/${filename}`,
  },
};

/**
 * Helper function to build URL with query params
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} - URL with query params
 */
export function buildUrl(baseUrl, params = {}) {
  const url = new URL(baseUrl);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
}

/**
 * Helper function to get auth headers
 * @returns {Object} - Headers with authorization token
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Helper function for authenticated fetch
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function authFetch(url, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

export default {
  API_URL,
  PYTHON_API_URL,
  endpoints,
  buildUrl,
  getAuthHeaders,
  authFetch,
};
