import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ensure clip file exists locally, downloading from cloud if needed
 * Centralized clip file resolution logic to avoid duplication
 * @param {Object} clip - Clip object from database
 * @returns {Promise<string>} - Local file path to clip
 */
export async function ensureClipExists(clip) {
  // Prioritize cloud_url if available
  let clipUrl = clip.cloud_url || clip.file_path;
  
  // Check if it's a Cloudinary URL
  if (clipUrl && (clipUrl.startsWith('http://') || clipUrl.startsWith('https://'))) {
    return await downloadClipFromCloud(clipUrl);
  }
  
  // Handle local paths (fallback)
  return resolveLocalClipPath(clip.file_path);
}

/**
 * Download clip from cloud storage (Cloudinary) to local filesystem
 * @param {string} cloudUrl - Cloud URL of the clip
 * @returns {Promise<string>} - Local file path
 */
async function downloadClipFromCloud(cloudUrl) {
  // Extract filename from URL
  const urlParts = cloudUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const localPath = path.join(__dirname, '..', 'downloads', 'clips', filename);
  
  // Check if file already exists locally
  if (fs.existsSync(localPath)) {
    logger.info('Clip already exists locally', { localPath });
    return localPath;
  }
  
  // Download from cloud
  logger.info('Downloading clip from cloud storage', { url: cloudUrl, localPath });
  
  // Ensure directory exists
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    const response = await axios({
      method: 'GET',
      url: cloudUrl,
      responseType: 'stream',
      timeout: 60000 // 60 second timeout
    });
    
    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    logger.info('Clip downloaded successfully', { localPath });
    return localPath;
  } catch (error) {
    logger.error('Failed to download clip from cloud', { 
      error: error.message, 
      url: cloudUrl 
    });
    throw new Error(`Failed to download clip: ${error.message}`);
  }
}

/**
 * Resolve local clip file path
 * @param {string} filePath - File path from database
 * @returns {string} - Resolved absolute path
 */
function resolveLocalClipPath(filePath) {
  if (!filePath) {
    throw new Error('No file path provided');
  }

  let clipPath = filePath;
  
  // Fix duplicate downloads/ prefix issue
  if (clipPath.includes('downloads/downloads')) {
    clipPath = clipPath.replace(/downloads\/downloads/g, 'downloads');
  }
  
  // Convert to absolute path
  if (clipPath.startsWith('downloads/') || clipPath.startsWith('downloads\\')) {
    clipPath = path.join(__dirname, '..', clipPath);
  } else if (!path.isAbsolute(clipPath)) {
    clipPath = path.join(__dirname, '..', 'downloads', 'clips', clipPath);
  }
  
  // Verify file exists
  if (fs.existsSync(clipPath)) {
    return clipPath;
  }
  
  throw new Error(`Clip file not found at path: ${clipPath}`);
}

/**
 * Get clip file size in bytes
 * @param {string} clipPath - Local file path
 * @returns {number} - File size in bytes
 */
export function getClipFileSize(clipPath) {
  try {
    const stats = fs.statSync(clipPath);
    return stats.size;
  } catch (error) {
    logger.error('Failed to get clip file size', { error: error.message, clipPath });
    return 0;
  }
}

/**
 * Validate clip file size
 * @param {string} clipPath - Local file path
 * @param {number} maxSize - Maximum allowed size in bytes (default: 2GB)
 * @returns {boolean} - True if valid, throws error if invalid
 */
export function validateClipFileSize(clipPath, maxSize = 2 * 1024 * 1024 * 1024) {
  const fileSize = getClipFileSize(clipPath);
  
  if (fileSize === 0) {
    throw new Error('Clip file is empty or cannot be read');
  }
  
  if (fileSize > maxSize) {
    const maxSizeGB = (maxSize / (1024 * 1024 * 1024)).toFixed(1);
    const fileSizeGB = (fileSize / (1024 * 1024 * 1024)).toFixed(1);
    throw new Error(`File too large: ${fileSizeGB}GB exceeds ${maxSizeGB}GB limit`);
  }
  
  return true;
}

/**
 * Create read stream for clip file
 * @param {string} clipPath - Local file path
 * @returns {ReadStream} - File read stream
 */
export function createClipReadStream(clipPath) {
  if (!fs.existsSync(clipPath)) {
    throw new Error(`Clip file not found: ${clipPath}`);
  }
  
  return fs.createReadStream(clipPath);
}
