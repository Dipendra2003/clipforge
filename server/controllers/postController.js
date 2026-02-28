import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import PlatformConnection from '../models/PlatformConnection.js';
import PublishedPost from '../models/PublishedPost.js';
import Clip from '../models/Clip.js';
import logger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

// Process scheduled upload in background
async function processScheduledUpload(postId, uploadData) {
  const { userId, clipId, clipPath, title, caption, privacy, connection } = uploadData;
  
  try {
    logger.info('Starting background upload for scheduled post', { postId, clipPath });

    // Update status to uploading
    await PublishedPost.updateStatus(postId, 'uploading');

    // Check if token is expired and refresh if needed
    if (PlatformConnection.isTokenExpired(connection)) {
      logger.info('YouTube token expired, refreshing...', { userId });
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

    // Prepare video metadata
    const videoDescription = caption || 'Created with ClipForge AI';

    logger.info('Uploading to YouTube (background)', { 
      title,
      privacy,
      postId
    });

    // Upload with final privacy status (no need for scheduler to update)
    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title,
          description: videoDescription,
          categoryId: '22',
          tags: ['shorts', 'viral', 'clipforge']
        },
        status: {
          privacyStatus: privacy || 'public', // Use final privacy status
          selfDeclaredMadeForKids: false
        }
      },
      media: {
        body: fs.createReadStream(clipPath)
      }
    });

    const videoId = uploadResponse.data.id;
    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;

    logger.info('Background YouTube upload successful', { 
      videoId, 
      videoUrl,
      postId
    });

    // Update post record with video details and set to published (not scheduled)
    await PublishedPost.updateStatus(
      postId,
      'published', // Mark as published since video is already public
      null,
      videoId,
      videoUrl
    );

    logger.authEvent('YOUTUBE_SCHEDULED_UPLOAD_SUCCESS', userId, { 
      clipId, 
      videoId,
      postId
    });

  } catch (error) {
    logger.error('Background upload error', { 
      postId,
      error: error.message,
      stack: error.stack
    });

    // Update post record with failure
    await PublishedPost.updateStatus(
      postId,
      'failed',
      `Upload failed: ${error.message}`
    );
  }
}

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
    
    // Update token in database - FIX: expiry_date is already a timestamp
    const expiresAt = new Date(credentials.expiry_date);
    await PlatformConnection.updateTokens(
      connection.user_id,
      'youtube',
      credentials.access_token,
      expiresAt
    );

    logger.info('YouTube token refreshed successfully', { 
      userId: connection.user_id,
      expiresAt 
    });

    return credentials.access_token;
  } catch (error) {
    logger.error('Token refresh error', { 
      error: error.message,
      userId: connection.user_id,
      code: error.code 
    });
    
    // If refresh token is invalid, user needs to reconnect
    if (error.code === 400 || error.message.includes('invalid_grant')) {
      throw new Error('YouTube connection expired. Please reconnect your account in Settings.');
    }
    
    throw new Error('Failed to refresh YouTube token. Please try again or reconnect your account.');
  }
}

// Post clip to YouTube Shorts
export const postToYouTube = async (req, res) => {
  let postRecord = null;
  
  try {
    const { clipId, title, caption, privacy, scheduledFor } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!clipId) {
      return res.status(400).json({ error: 'Clip ID is required' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Get clip from database
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Verify ownership
    if (clip.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get YouTube connection
    let connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
    if (!connection) {
      return res.status(400).json({ 
        error: 'YouTube not connected',
        message: 'Please connect your YouTube account in Settings first'
      });
    }

    // Validate that connection has required data
    if (!connection.platform_user_id || !connection.platform_username) {
      logger.error('Invalid YouTube connection - missing channel data', { userId });
      return res.status(400).json({ 
        error: 'Invalid YouTube connection',
        message: 'Your YouTube connection is incomplete. Please reconnect your account in Settings.'
      });
    }

    // Check if token is expired and refresh if needed
    if (PlatformConnection.isTokenExpired(connection)) {
      logger.info('YouTube token expired, refreshing...', { userId });
      try {
        const newAccessToken = await refreshYouTubeToken(connection);
        connection.access_token = newAccessToken;
      } catch (refreshError) {
        logger.error('Token refresh failed during post', { 
          userId, 
          error: refreshError.message 
        });
        return res.status(401).json({ 
          error: 'YouTube authentication expired',
          message: refreshError.message
        });
      }
    }

    // Verify clip file exists
    let clipPath = clip.file_path;
    
    // Fix duplicate downloads/ prefix issue
    if (clipPath.includes('downloads/downloads')) {
      clipPath = clipPath.replace('downloads/downloads', 'downloads');
    }
    
    // Handle different path formats
    if (clipPath.startsWith('downloads/') || clipPath.startsWith('downloads\\')) {
      // Relative path from server root
      clipPath = path.join(__dirname, '..', clipPath);
    } else if (clipPath.startsWith('http://') || clipPath.startsWith('https://')) {
      // Extract filename from URL
      const urlParts = clipPath.split('/');
      const filename = urlParts[urlParts.length - 1];
      clipPath = path.join(__dirname, '..', 'downloads', filename);
    } else if (!path.isAbsolute(clipPath)) {
      // Assume it's just a filename
      clipPath = path.join(__dirname, '..', 'downloads', clipPath);
    }

    console.log('Resolved clip path:', clipPath);

    if (!fs.existsSync(clipPath)) {
      console.error('Clip file not found:', clipPath);
      console.error('Original file_path from DB:', clip.file_path);
      return res.status(404).json({ 
        error: 'Clip file not found',
        message: 'The clip file does not exist on the server',
        debug: {
          dbPath: clip.file_path,
          resolvedPath: clipPath
        }
      });
    }

    // Create post record
    const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();
    const scheduledDate = isScheduled ? new Date(scheduledFor) : null;
    
    postRecord = await PublishedPost.create({
      userId,
      clipId,
      platform: 'youtube',
      title: title.trim(),
      caption: caption?.trim() || '',
      status: isScheduled ? 'pending' : 'uploading',
      scheduledFor: scheduledDate,
      isScheduled: isScheduled,
      metadata: { privacy: privacy || 'public' }
    });

    // For scheduled posts, process upload in background and respond immediately
    if (isScheduled) {
      logger.info('Scheduling YouTube upload for later', { 
        userId, 
        clipId, 
        postId: postRecord.id,
        scheduledFor: scheduledDate
      });

      // Process upload asynchronously
      processScheduledUpload(postRecord.id, {
        userId,
        clipId,
        clipPath,
        title: title.trim(),
        caption: caption?.trim() || '',
        privacy: privacy || 'public',
        connection
      }).catch(error => {
        logger.error('Background upload failed', { 
          postId: postRecord.id,
          error: error.message 
        });
      });

      // Update clip status
      await Clip.update(clipId, { status: 'completed' });

      // Respond immediately
      return res.json({
        success: true,
        message: `Video scheduled for ${scheduledDate.toLocaleString('en-US', { timeZone: 'UTC' })} UTC. Upload will begin shortly.`,
        scheduled: true,
        scheduledFor: scheduledDate,
        post: {
          id: postRecord.id,
          platform: 'youtube',
          status: 'pending',
          title: title.trim(),
          caption: caption?.trim() || '',
          scheduledFor: scheduledDate,
          isScheduled: true,
          clipId: clipId,
          clip_id: clipId // Add both formats for compatibility
        }
      });
    }

    logger.info('Starting YouTube upload', { 
      userId, 
      clipId, 
      postId: postRecord.id,
      clipPath 
    });

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

    // Prepare video metadata
    const videoTitle = title.trim();
    const videoDescription = caption?.trim() || clip.transcript || 'Created with ClipForge AI';
    const videoPrivacy = privacy || 'public';

    // Upload video to YouTube
    const fileSize = fs.statSync(clipPath).size;
    
    // Validate file size (YouTube limit is 256GB, but let's be reasonable)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (fileSize > maxSize) {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'Video file exceeds 2GB limit'
      });
    }
    
    logger.info('Uploading to YouTube', { 
      title: videoTitle,
      fileSize,
      privacy: videoPrivacy,
      scheduled: isScheduled,
      scheduledFor: scheduledDate,
      channelId: connection.platform_user_id
    });

    // Prepare status object
    // NOTE: YouTube's publishAt doesn't work reliably for Shorts
    // So we upload as private and use our scheduler to publish later
    const statusConfig = {
      privacyStatus: isScheduled ? 'private' : videoPrivacy,
      selfDeclaredMadeForKids: false
    };

    // For reference: publishAt would be used like this for regular videos
    // But it doesn't work for Shorts, so we handle scheduling ourselves
    // if (isScheduled && scheduledDate) {
    //   statusConfig.publishAt = scheduledDate.toISOString();
    // }

    logger.info('YouTube API request config', { 
      statusConfig,
      isScheduled,
      willUseScheduler: isScheduled
    });

    const uploadResponse = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: videoTitle,
          description: videoDescription,
          categoryId: '22', // People & Blogs category
          tags: ['shorts', 'viral', 'clipforge']
        },
        status: statusConfig
      },
      media: {
        body: fs.createReadStream(clipPath)
      }
    });

    const videoId = uploadResponse.data.id;
    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;

    logger.info('YouTube upload successful', { 
      videoId, 
      videoUrl,
      postId: postRecord.id,
      scheduled: isScheduled,
      scheduledFor: scheduledDate
    });

    // Update post record with success
    const finalStatus = isScheduled ? 'scheduled' : 'published';
    await PublishedPost.updateStatus(
      postRecord.id,
      finalStatus,
      null,
      videoId,
      videoUrl
    );

    // Update clip status
    await Clip.update(clipId, { status: isScheduled ? 'completed' : 'posted' });

    logger.authEvent(isScheduled ? 'YOUTUBE_SCHEDULED_SUCCESS' : 'YOUTUBE_POST_SUCCESS', userId, { 
      clipId, 
      videoId,
      postId: postRecord.id,
      scheduledFor: scheduledDate
    });

    res.json({
      success: true,
      message: isScheduled 
        ? `Video uploaded! Will be published on ${scheduledDate.toLocaleString('en-US', { timeZone: 'UTC' })} UTC`
        : 'Clip posted to YouTube successfully!',
      scheduled: isScheduled,
      scheduledFor: scheduledDate,
      videoId,
      videoUrl,
      post: {
        id: postRecord.id,
        platform: 'youtube',
        status: finalStatus,
        title: videoTitle,
        caption: videoDescription,
        platformVideoId: videoId,
        platform_video_id: videoId,
        platformUrl: videoUrl,
        platform_url: videoUrl,
        scheduledFor: scheduledDate,
        scheduled_for: scheduledDate,
        isScheduled: isScheduled,
        clipId: clipId,
        clip_id: clipId
      }
    });

  } catch (error) {
    logger.error('YouTube post error', { 
      error: error.message,
      userId: req.user.id,
      stack: error.stack
    });

    // Update post record with failure
    if (postRecord) {
      await PublishedPost.updateStatus(
        postRecord.id,
        'failed',
        error.message
      );
    }

    // Handle specific YouTube API errors
    if (error.code === 401 || error.message.includes('invalid_grant')) {
      return res.status(401).json({ 
        error: 'YouTube authentication expired',
        message: 'Please reconnect your YouTube account in Settings'
      });
    }

    if (error.code === 403) {
      return res.status(403).json({ 
        error: 'YouTube API access denied',
        message: 'Your YouTube account may not have permission to upload videos. Check your channel status and API quotas.'
      });
    }

    if (error.code === 400) {
      return res.status(400).json({ 
        error: 'Invalid video format or request',
        message: error.message || 'The video format may not be supported by YouTube'
      });
    }

    if (error.message && error.message.includes('quota')) {
      return res.status(429).json({ 
        error: 'YouTube API quota exceeded',
        message: 'Daily upload quota reached. Please try again tomorrow.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to post to YouTube',
      message: error.message
    });
  }
};

// Get user's published posts
export const getPublishedPosts = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const posts = await PublishedPost.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
    const total = await PublishedPost.countByUserId(req.user.id);

    res.json({
      posts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Get published posts error', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch published posts' });
  }
};

// Get posts for a specific clip
export const getClipPosts = async (req, res) => {
  try {
    const { clipId } = req.params;
    
    // Verify clip ownership
    const clip = await Clip.findById(clipId);
    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }
    
    if (clip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const posts = await PublishedPost.findByClipId(clipId);
    res.json({ posts });
  } catch (error) {
    logger.error('Get clip posts error', { error: error.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch clip posts' });
  }
};

// Delete post record (when video deleted from YouTube)
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Get post record
    const post = await PublishedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get clip to update status
    const clip = await Clip.findById(post.clip_id);
    
    // Delete post record
    await PublishedPost.delete(postId);

    // Update clip status back to 'completed' so it can be posted again
    if (clip) {
      await Clip.update(post.clip_id, { status: 'completed' });
    }

    logger.info('Post deleted', { 
      postId, 
      userId, 
      clipId: post.clip_id,
      platform: post.platform 
    });

    res.json({ 
      success: true, 
      message: 'Post deleted successfully. You can now post this clip again.',
      clipId: post.clip_id
    });

  } catch (error) {
    logger.error('Delete post error', { 
      error: error.message, 
      userId: req.user.id,
      postId: req.params.postId
    });
    res.status(500).json({ 
      error: 'Failed to delete post',
      message: error.message 
    });
  }
};

// Verify if YouTube video still exists
export const verifyYouTubeVideo = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Get post record
    const post = await PublishedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (post.platform !== 'youtube') {
      return res.status(400).json({ error: 'Only YouTube posts can be verified' });
    }

    if (!post.platform_video_id) {
      return res.status(400).json({ error: 'No YouTube video ID found' });
    }

    // Get YouTube connection
    let connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
    if (!connection) {
      return res.status(400).json({ 
        error: 'YouTube not connected',
        message: 'Please reconnect your YouTube account in Settings'
      });
    }

    // Check if token is expired and refresh if needed
    if (PlatformConnection.isTokenExpired(connection)) {
      try {
        const newAccessToken = await refreshYouTubeToken(connection);
        connection.access_token = newAccessToken;
      } catch (refreshError) {
        return res.status(401).json({ 
          error: 'YouTube authentication expired',
          message: 'Please reconnect your YouTube account in Settings'
        });
      }
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

    // Try to get video details
    try {
      const videoResponse = await youtube.videos.list({
        part: ['snippet', 'status'],
        id: [post.platform_video_id]
      });

      if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
        // Video not found - it was deleted
        logger.info('YouTube video not found (deleted)', { 
          postId, 
          videoId: post.platform_video_id 
        });

        // Update post status to 'deleted'
        await PublishedPost.updateStatus(postId, 'failed', 'Video deleted from YouTube');

        // Update clip status back to 'completed'
        await Clip.update(post.clip_id, { status: 'completed' });

        return res.json({
          exists: false,
          message: 'Video was deleted from YouTube',
          action: 'Post record updated. You can post this clip again.'
        });
      }

      // Video exists
      const video = videoResponse.data.items[0];
      logger.info('YouTube video verified', { 
        postId, 
        videoId: post.platform_video_id,
        status: video.status.privacyStatus
      });

      res.json({
        exists: true,
        message: 'Video exists on YouTube',
        video: {
          title: video.snippet.title,
          privacyStatus: video.status.privacyStatus,
          publishedAt: video.snippet.publishedAt
        }
      });

    } catch (apiError) {
      // Handle YouTube API errors
      if (apiError.code === 404 || apiError.message?.includes('not found')) {
        // Video deleted
        await PublishedPost.updateStatus(postId, 'failed', 'Video deleted from YouTube');
        await Clip.update(post.clip_id, { status: 'completed' });

        return res.json({
          exists: false,
          message: 'Video was deleted from YouTube',
          action: 'Post record updated. You can post this clip again.'
        });
      }

      throw apiError;
    }

  } catch (error) {
    logger.error('Verify YouTube video error', { 
      error: error.message,
      userId: req.user.id,
      postId: req.params.postId
    });

    res.status(500).json({ 
      error: 'Failed to verify video',
      message: error.message 
    });
  }
};

// Get scheduled posts for user
export const getScheduledPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const posts = await PublishedPost.findScheduledByUserId(userId);

    res.json({
      success: true,
      posts,
      count: posts.length
    });
  } catch (error) {
    logger.error('Get scheduled posts error', { 
      error: error.message, 
      userId: req.user.id 
    });
    res.status(500).json({ 
      error: 'Failed to fetch scheduled posts',
      message: error.message 
    });
  }
};

// Cancel scheduled post
export const cancelScheduledPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Get post record
    const post = await PublishedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Verify it's a scheduled post
    if (post.status !== 'scheduled') {
      return res.status(400).json({ 
        error: 'Invalid operation',
        message: 'Only scheduled posts can be cancelled'
      });
    }

    // If video was uploaded to YouTube, we should delete it or keep it private
    if (post.platform_video_id) {
      try {
        // Get YouTube connection
        let connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
        
        if (connection) {
          // Check if token is expired and refresh if needed
          if (PlatformConnection.isTokenExpired(connection)) {
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

          // Delete the video from YouTube
          await youtube.videos.delete({
            id: post.platform_video_id
          });

          logger.info('Scheduled video deleted from YouTube', { 
            postId, 
            videoId: post.platform_video_id 
          });
        }
      } catch (youtubeError) {
        logger.error('Failed to delete YouTube video', { 
          error: youtubeError.message,
          postId,
          videoId: post.platform_video_id
        });
        // Continue with cancellation even if YouTube deletion fails
      }
    }

    // Cancel the scheduled post
    await PublishedPost.cancelScheduled(postId);

    // Update clip status back to 'completed'
    await Clip.update(post.clip_id, { status: 'completed' });

    logger.info('Scheduled post cancelled', { 
      postId, 
      userId, 
      clipId: post.clip_id,
      videoDeleted: !!post.platform_video_id
    });

    res.json({ 
      success: true, 
      message: post.platform_video_id 
        ? 'Scheduled post cancelled and video deleted from YouTube'
        : 'Scheduled post cancelled successfully',
      clipId: post.clip_id
    });

  } catch (error) {
    logger.error('Cancel scheduled post error', { 
      error: error.message, 
      userId: req.user.id,
      postId: req.params.postId
    });
    res.status(500).json({ 
      error: 'Failed to cancel scheduled post',
      message: error.message 
    });
  }
};
