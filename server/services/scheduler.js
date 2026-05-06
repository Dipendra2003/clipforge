import cron from 'node-cron';
import { google } from 'googleapis';
import fs from 'fs';
import PublishedPost from '../models/PublishedPost.js';
import PlatformConnection from '../models/PlatformConnection.js';
import Clip from '../models/Clip.js';
import logger from '../utils/logger.js';
import { ensureValidYouTubeConnection, getYouTubeClient } from '../utils/youtubeAuth.js';
import { ensureClipExists, createClipReadStream } from '../utils/clipStorage.js';
import { sendScheduledPostReminders } from './notificationService.js';

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

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

    // Get YouTube connection and ensure it's valid
    const connection = await ensureValidYouTubeConnection(post.user_id);

    // Update status to uploading
    await PublishedPost.updateStatus(post.id, 'uploading');

    // Ensure clip file exists (download from Cloudinary if needed)
    const clipPath = await ensureClipExists(clip);
    logger.info('Clip ready for scheduled upload', { clipPath });

    // Initialize YouTube API
    const youtube = getYouTubeClient(connection);

    // Get privacy setting from metadata (default to public)
    const privacy = post.metadata?.privacy || 'public';
    const videoTitle = post.title || 'Untitled';
    const videoDescription = post.caption || clip.transcript || 'Created with ClipForge AI';

    logger.info('Uploading scheduled video to YouTube', { 
      title: videoTitle,
      privacy,
      channelId: connection.platform_user_id
    });

    // Upload with timeout (5 minutes max)
    const uploadPromise = youtube.videos.insert({
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
        body: createClipReadStream(clipPath)
      }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 5 minutes')), 5 * 60 * 1000)
    );

    const videoResponse = await Promise.race([uploadPromise, timeoutPromise]);

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
      stack: error.stack,
      errorType: error.constructor.name
    });

    // Update post record with failure
    await PublishedPost.updateStatus(
      post.id,
      'failed',
      `Failed to upload: ${error.message}`
    );

    // Reset clip status back to 'ready' so user can retry
    await Clip.update(post.clip_id, { status: 'ready' });

    return { success: false, error: error.message };
  }
}

// Initialize scheduler
export function initScheduler() {
  // Run every minute - check for scheduled posts to publish
  cron.schedule('* * * * *', async () => {
    await processScheduledPosts();
  });

  // Run every day at 9 AM IST - send scheduled post reminders
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running scheduled post reminder job...');
    await sendScheduledPostReminders();
  }, {
    timezone: 'Asia/Kolkata'
  });

  logger.info('Scheduler initialized:');
  logger.info('  - Checking for scheduled posts every minute');
  logger.info('  - Sending post reminders daily at 9 AM IST');
}

export default { initScheduler, processScheduledPosts, publishScheduledVideo };
