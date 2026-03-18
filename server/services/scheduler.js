import cron from 'node-cron';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import PublishedPost from '../models/PublishedPost.js';
import PlatformConnection from '../models/PlatformConnection.js';
import Clip from '../models/Clip.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

// Refresh YouTube access token if expired
async function refreshYouTubeToken(connection) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: connection.refresh_token
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    const expiresAt = new Date(credentials.expiry_date);
    await PlatformConnection.updateTokens(
      connection.user_id,
      'youtube',
      credentials.access_token,
      expiresAt
    );

    logger.info('YouTube token refreshed for scheduled post', { 
      userId: connection.user_id,
      expiresAt 
    });

    return credentials.access_token;
  } catch (error) {
    logger.error('Token refresh error in scheduler', { 
      error: error.message,
      userId: connection.user_id
    });
    throw new Error('Failed to refresh YouTube token');
  }
}

// Process all scheduled posts that are due
async function processScheduledPosts() {
  let retries = 3;
  let lastError = null;
  
  while (retries > 0) {
    try {
      const scheduledPosts = await PublishedPost.findScheduledPosts();
      
      // Only log when there are posts to process
      if (scheduledPosts.length === 0) {
        return;
      }

      logger.info(`Found ${scheduledPosts.length} scheduled post(s) to process`);
      
      // Log each post's scheduled time
      scheduledPosts.forEach(post => {
        logger.info('Scheduled post details', {
          postId: post.id,
          scheduledFor: post.scheduled_for,
          scheduledForIST: new Date(post.scheduled_for).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });
      });

      // Process each scheduled post
      for (const post of scheduledPosts) {
        await publishScheduledVideo(post);
      }
      
      // Success - break out of retry loop
      return;

    } catch (error) {
      lastError = error;
      retries--;
      
      // Check if it's a connection error
      const isConnectionError = error.message.includes('ETIMEDOUT') || 
                               error.message.includes('ENOTFOUND') ||
                               error.message.includes('ECONNRESET') ||
                               error.message.includes('Connection terminated');
      
      if (isConnectionError && retries > 0) {
        logger.warn(`Database connection error, retrying... (${retries} attempts left)`, {
          error: error.message
        });
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Not a connection error or out of retries
        logger.error('Scheduler error', { 
          error: error.message,
          stack: error.stack
        });
        break;
      }
    }
  }
  
  // If we exhausted all retries
  if (retries === 0 && lastError) {
    logger.error('Scheduler failed after all retries', {
      error: lastError.message
    });
  }
}

// Publish a scheduled video (upload at scheduled time)
async function publishScheduledVideo(post) {
  try {
    logger.info('Processing scheduled video upload', { 
      postId: post.id,
      userId: post.user_id,
      scheduledFor: post.scheduled_for
    });

    // Get clip from database
    const clip = await Clip.findById(post.clip_id);
    if (!clip) {
      throw new Error('Clip not found');
    }

    // Get YouTube connection
    let connection = await PlatformConnection.findByUserAndPlatform(post.user_id, 'youtube');
    if (!connection) {
      throw new Error('YouTube not connected');
    }

    // Check if token is expired and refresh if needed
    if (PlatformConnection.isTokenExpired(connection)) {
      logger.info('YouTube token expired, refreshing for scheduled post...', { 
        userId: post.user_id 
      });
      const newAccessToken = await refreshYouTubeToken(connection);
      connection.access_token = newAccessToken;
    }

    // Update status to uploading
    await PublishedPost.updateStatus(post.id, 'uploading');

    // Ensure clip file exists (download from Cloudinary if needed)
    const clipPath = await ensureClipExists(clip);
    logger.info('Clip ready for scheduled upload', { clipPath });

    // Initialize YouTube API
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Get privacy setting from metadata (default to public)
    const privacy = post.metadata?.privacy || 'public';
    const videoTitle = post.title || 'Untitled';
    const videoDescription = post.caption || clip.transcript || 'Created with ClipForge AI';

    // Upload video to YouTube
    const fileSize = fs.statSync(clipPath).size;
    
    logger.info('Uploading scheduled video to YouTube', { 
      title: videoTitle,
      fileSize,
      privacy,
      channelId: connection.platform_user_id
    });

    const videoResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: videoTitle,
          description: videoDescription,
          categoryId: '22', // People & Blogs
          tags: ['shorts', 'short', 'viral', 'clipforge']
        },
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(clipPath)
      }
    });

    const videoId = videoResponse.data.id;
    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;

    logger.info('Scheduled video uploaded successfully', { 
      postId: post.id,
      videoId,
      videoUrl,
      privacy
    });

    // Update post record with success
    await PublishedPost.updateStatus(
      post.id,
      'published',
      null,
      videoId,
      videoUrl
    );

    // Update clip status to 'posted'
    await Clip.update(post.clip_id, { status: 'posted' });

    logger.authEvent('SCHEDULED_POST_PUBLISHED', post.user_id, { 
      clipId: post.clip_id, 
      videoId,
      postId: post.id 
    });

    return { success: true, videoId, videoUrl };

  } catch (error) {
    logger.error('Scheduled video upload error', { 
      postId: post.id,
      error: error.message,
      stack: error.stack
    });

    // Update post record with failure
    await PublishedPost.updateStatus(
      post.id,
      'failed',
      `Failed to upload: ${error.message}`
    );

    return { success: false, error: error.message };
  }
}

// Helper function to download clip from Cloudinary if needed
async function ensureClipExists(clip) {
  const axios = (await import('axios')).default;
  
  // Prioritize cloud_url if available
  let clipUrl = clip.cloud_url || clip.file_path;
  
  // Check if it's a Cloudinary URL
  if (clipUrl && (clipUrl.startsWith('http://') || clipUrl.startsWith('https://'))) {
    // Extract filename from URL
    const urlParts = clipUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const localPath = path.join(__dirname, '..', 'downloads', 'clips', filename);
    
    // Check if file already exists locally
    if (fs.existsSync(localPath)) {
      logger.info('Clip already exists locally', { localPath });
      return localPath;
    }
    
    // Download from Cloudinary
    logger.info('Downloading clip from Cloudinary for scheduled upload', { url: clipUrl, localPath });
    
    // Ensure directory exists
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    try {
      const response = await axios({
        method: 'GET',
        url: clipUrl,
        responseType: 'stream'
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
      logger.error('Failed to download clip from Cloudinary', { 
        error: error.message, 
        url: clipUrl 
      });
      throw new Error(`Failed to download clip: ${error.message}`);
    }
  }
  
  // Handle local paths (fallback)
  let clipPath = clip.file_path;
  
  // Fix duplicate downloads/ prefix issue
  if (clipPath && clipPath.includes('downloads/downloads')) {
    clipPath = clipPath.replace(/downloads\/downloads/g, 'downloads');
  }
  
  if (clipPath && (clipPath.startsWith('downloads/') || clipPath.startsWith('downloads\\'))) {
    clipPath = path.join(__dirname, '..', clipPath);
  } else if (clipPath && !path.isAbsolute(clipPath)) {
    clipPath = path.join(__dirname, '..', 'downloads', 'clips', clipPath);
  }
  
  if (clipPath && fs.existsSync(clipPath)) {
    return clipPath;
  }
  
  throw new Error(`Clip file not available. No valid cloud_url or local file_path found.`);
}

// Initialize scheduler
export function initScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    await processScheduledPosts();
  });

  logger.info('Scheduler initialized - checking for scheduled posts every minute');
}

export default { initScheduler, processScheduledPosts, publishScheduledVideo };
