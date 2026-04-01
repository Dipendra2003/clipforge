/**
 * Construct proper video URL from database file_path or cloud_url
 * Priority: cloud_url > file_path
 * Handles multiple formats:
 * - Cloud URL: https://res.cloudinary.com/...
 * - Full URL: http://localhost:5001/video/file.mp4
 * - Relative path: downloads/file.mp4 or downloads\file.mp4 (Windows)
 * - Clips path: downloads/clips/file.mp4
 * - Just filename: file.mp4
 */
export function getVideoUrl(filePath, cloudUrl = null) {
  // Priority 1: Use cloud URL if available
  if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
    return cloudUrl;
  }

  if (!filePath) {
    return '';
  }

  // Priority 2: If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Priority 3: Construct local server URL
  // Normalize path separators (Windows backslashes to forward slashes)
  let filename = filePath.replace(/\\/g, '/');
  
  // Remove 'downloads/' and 'downloads/clips/' prefixes if present
  // Flask serves from downloads folder, so we need just the filename
  filename = filename.replace(/^downloads\/clips\//, '');
  filename = filename.replace(/^downloads\//, '');
  filename = filename.replace(/^clips\//, '');

  // Construct Flask server URL - use localhost instead of 127.0.0.1 for consistency
  const videoUrl = `http://localhost:5001/video/${filename}`;

  return videoUrl;
}

/**
 * Format duration in seconds to MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human readable
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download a file from URL with proper blob handling
 * @param {string} url - The URL to download from
 * @param {string} filename - The filename to save as
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export function downloadFile(url, filename, onSuccess, onError) {
  fetch(url)
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      if (onSuccess) onSuccess();
    })
    .catch(error => {
      if (onError) onError(error);
    });
}

/**
 * Detect platform from source URL
 * @param {string} sourceUrl - The source URL of the video
 * @returns {object} Platform info with name, icon, and color
 */
export function detectPlatform(sourceUrl) {
  if (!sourceUrl) {
    return {
      name: 'Upload',
      icon: '📤',
      color: 'blue'
    };
  }

  const url = sourceUrl.toLowerCase();

  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return {
      name: 'YouTube',
      icon: '▶️',
      color: 'red'
    };
  }

  // Facebook
  if (url.includes('facebook.com') || url.includes('fb.com') || url.includes('fb.watch')) {
    return {
      name: 'Facebook',
      icon: '📘',
      color: 'blue'
    };
  }

  // Instagram
  if (url.includes('instagram.com') || url.includes('instagr.am')) {
    return {
      name: 'Instagram',
      icon: '📷',
      color: 'pink'
    };
  }

  // TikTok
  if (url.includes('tiktok.com')) {
    return {
      name: 'TikTok',
      icon: '🎵',
      color: 'black'
    };
  }

  // Twitter/X
  if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) {
    return {
      name: 'Twitter',
      icon: '🐦',
      color: 'sky'
    };
  }

  // Vimeo
  if (url.includes('vimeo.com')) {
    return {
      name: 'Vimeo',
      icon: '🎬',
      color: 'cyan'
    };
  }

  // Twitch
  if (url.includes('twitch.tv')) {
    return {
      name: 'Twitch',
      icon: '🎮',
      color: 'purple'
    };
  }

  // LinkedIn
  if (url.includes('linkedin.com')) {
    return {
      name: 'LinkedIn',
      icon: '💼',
      color: 'blue'
    };
  }

  // Dailymotion
  if (url.includes('dailymotion.com')) {
    return {
      name: 'Dailymotion',
      icon: '🎥',
      color: 'blue'
    };
  }

  // Reddit
  if (url.includes('reddit.com') || url.includes('redd.it')) {
    return {
      name: 'Reddit',
      icon: '🤖',
      color: 'orange'
    };
  }

  // Default for unknown URLs
  return {
    name: 'Web',
    icon: '🔗',
    color: 'gray'
  };
}
