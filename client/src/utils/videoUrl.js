/**
 * Construct proper video URL from database file_path
 * Handles multiple formats:
 * - Full URL: http://localhost:5001/video/file.mp4
 * - Relative path: downloads/file.mp4 or downloads\file.mp4 (Windows)
 * - Just filename: file.mp4
 */
export function getVideoUrl(filePath) {
  if (!filePath) {
    console.warn('⚠️  No file path provided');
    return '';
  }

  // If already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    console.log('✅ Using full URL:', filePath);
    return filePath;
  }

  // Normalize path separators (Windows backslashes to forward slashes)
  let filename = filePath.replace(/\\/g, '/');
  
  // Remove 'downloads/' prefix if present - Flask serves from downloads folder
  // Handle multiple 'downloads/' prefixes (e.g., 'downloads/downloads/file.mp4')
  while (filename.startsWith('downloads/')) {
    filename = filename.substring('downloads/'.length);
  }

  // Construct Flask server URL - use localhost instead of 127.0.0.1 for consistency
  const videoUrl = `http://localhost:5001/video/${filename}`;
  
  console.log('🎬 Video URL constructed:', {
    input: filePath,
    output: videoUrl
  });

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
      console.error('Download error:', error);
      if (onError) onError(error);
    });
}
