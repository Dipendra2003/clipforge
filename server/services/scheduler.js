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
  try {
    const scheduledPosts = await PublishedPost.findScheduledPosts();
    
    if (scheduledPosts.length === 0) {
      return;
    }

    logger.info(`Found ${scheduledPosts.length} scheduled post(s) to process`);

    // Process each scheduled post
    for (const post of scheduledPosts) {
      await publishScheduledVideo(post);
    }

  } catch (error) {
    logger.error('Scheduler error', { 
      error: error.message,
      stack: error.stack
    });
  }
}

// Publish a scheduled video (change from private to public)
async function publishScheduledVideo(post) {
  try {
    logger.info('Publishing scheduled video', { 
      postId: post.id,
      userId: post.user_id,
      videoId: post.platform_video_id,
      scheduledFor: post.scheduled_for
    });

    if (!post.platform_video_id) {
      throw new Error('No video ID found for scheduled post');
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

    // Update video status to public
    await youtube.videos.update({
      part: ['status'],
      requestBody: {
        id: post.platform_video_id,
        status: {
          privacyStatus: privacy,
          selfDeclaredMadeForKids: false
        }
      }
    });

    logger.info('Scheduled video published successfully', { 
      postId: post.id,
      videoId: post.platform_video_id,
      privacy
    });

    // Update post record with success
    await PublishedPost.updateStatus(
      post.id,
      'published',
      null,
      post.platform_video_id,
      post.platform_url
    );

    // Update clip status to 'posted'
    await Clip.update(post.clip_id, { status: 'posted' });

    logger.authEvent('SCHEDULED_POST_PUBLISHED', post.user_id, { 
      clipId: post.clip_id, 
      videoId: post.platform_video_id,
      postId: post.id 
    });

    return { success: true, videoId: post.platform_video_id };

  } catch (error) {
    logger.error('Scheduled video publish error', { 
      postId: post.id,
      error: error.message,
      stack: error.stack
    });

    // Update post record with failure
    await PublishedPost.updateStatus(
      post.id,
      'failed',
      `Failed to publish: ${error.message}`
    );

    return { success: false, error: error.message };
  }
}

// Initialize scheduler
export function initScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    logger.info('Running scheduled posts check...');
    await processScheduledPosts();
  });

  logger.info('Scheduler initialized - checking for scheduled posts every minute');
}

export default { initScheduler, processScheduledPosts, publishScheduledVideo };
