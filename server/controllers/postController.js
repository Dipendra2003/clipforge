import { google } from 'googleapis';
import fs from 'fs';
import PlatformConnection from '../models/PlatformConnection.js';
import PublishedPost from '../models/PublishedPost.js';
import Clip from '../models/Clip.js';
import logger from '../utils/logger.js';
import { ensureValidYouTubeConnection, getYouTubeClient } from '../utils/youtubeAuth.js';
import { ensureClipExists, validateClipFileSize, createClipReadStream } from '../utils/clipStorage.js';

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

// Post clip to YouTube Shorts
export const postToYouTube = async (req, res) => {
  let postRecord = null;
  
  try {
    const { clipId, title, caption, privacy, scheduledFor, timezone } = req.body;
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

    // Get YouTube connection and ensure it's valid
    let connection;
    try {
      connection = await ensureValidYouTubeConnection(userId);
    } catch (error) {
      return res.status(400).json({ 
        error: 'YouTube connection error',
        message: error.message
      });
    }

    // Verify clip file exists
    let clipPath;
    try {
      clipPath = await ensureClipExists(clip);
      logger.info('Clip ready for upload', { clipPath });
    } catch (error) {
      logger.error('Failed to prepare clip for upload', { 
        error: error.message,
        clipId,
        filePath: clip.file_path 
      });
      return res.status(404).json({ 
        error: 'Clip file not available',
        message: error.message
      });
    }

    // Create post record
    let isScheduled = false;
    let scheduledDate = null;
    
    if (scheduledFor) {
      // If timezone is provided (IST), treat the datetime as IST
      if (timezone === 'Asia/Kolkata') {
        // Parse as IST datetime string (e.g., "2026-03-01T17:27:00")
        // Store it as-is in database with timezone
        scheduledDate = new Date(scheduledFor + '+05:30'); // Add IST offset
      } else {
        // Fallback to treating as UTC
        scheduledDate = new Date(scheduledFor);
      }
      
      // Check if scheduled time is in the future
      const now = new Date();
      isScheduled = scheduledDate > now;
    }
    
    postRecord = await PublishedPost.create({
      userId,
      clipId,
      platform: 'youtube',
      title: title.trim(),
      caption: caption?.trim() || '',
      status: isScheduled ? 'scheduled' : 'uploading',
      scheduledFor: scheduledDate,
      isScheduled: isScheduled,
      metadata: { privacy: privacy || 'public' }
    });

    // For scheduled posts, DON'T upload now - let scheduler handle it
    if (isScheduled) {
      logger.info('Post scheduled for later', { 
        userId, 
        clipId, 
        postId: postRecord.id,
        scheduledFor: scheduledDate
      });

      // Update clip status
      await Clip.update(clipId, { status: 'completed' });

      // Respond immediately
      return res.json({
        success: true,
        message: `Video scheduled for ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST. It will be uploaded automatically at the scheduled time.`,
        scheduled: true,
        scheduledFor: scheduledDate,
        post: {
          id: postRecord.id,
          platform: 'youtube',
          status: 'scheduled',
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

    // Validate file size
    try {
      validateClipFileSize(clipPath);
    } catch (sizeError) {
      return res.status(400).json({ 
        error: 'File validation failed',
        message: sizeError.message
      });
    }

    // Initialize YouTube API
    const youtube = getYouTubeClient(connection);

    // Prepare video metadata
    const videoTitle = title.trim();
    const videoDescription = caption?.trim() || clip.transcript || 'Created with ClipForge AI';
    const videoPrivacy = privacy || 'public';
    
    logger.info('Uploading to YouTube', { 
      title: videoTitle,
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
        body: createClipReadStream(clipPath)
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
        ? `Video uploaded! Will be published on ${scheduledDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`
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

// Delete post record AND video from YouTube
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { deleteFromPlatform = false } = req.body; // Option to delete from YouTube too

    // Get post record
    const post = await PublishedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Verify ownership
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let deletedFromYouTube = false;
    let youtubeError = null;

    // Delete from YouTube if requested and video exists
    if (deleteFromPlatform && post.platform === 'youtube' && post.platform_video_id) {
      try {
        // Get YouTube connection
        const connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
        
        if (connection) {
          // Check if token is expired and refresh if needed
          let accessToken = connection.access_token;
          if (PlatformConnection.isTokenExpired(connection)) {
            const newToken = await refreshYouTubeToken(connection);
            accessToken = newToken;
          }

          // Delete video from YouTube
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`
          );

          oauth2Client.setCredentials({
            access_token: accessToken
          });

          const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client
          });

          // Delete the video
          await youtube.videos.delete({
            id: post.platform_video_id
          });

          deletedFromYouTube = true;
          logger.info('Video deleted from YouTube', { 
            postId, 
            videoId: post.platform_video_id,
            userId 
          });
        }
      } catch (error) {
        youtubeError = error.message;
        logger.error('Failed to delete from YouTube', { 
          error: error.message,
          postId,
          videoId: post.platform_video_id
        });
        // Continue to delete record even if YouTube deletion fails
      }
    }

    // Get clip to update status
    const clip = await Clip.findById(post.clip_id);
    
    // Delete post record from database
    await PublishedPost.delete(postId);

    // Update clip status back to 'completed' so it can be posted again
    if (clip) {
      await Clip.update(post.clip_id, { status: 'completed' });
    }

    logger.info('Post deleted', { 
      postId, 
      userId, 
      clipId: post.clip_id,
      platform: post.platform,
      deletedFromYouTube
    });

    let message = 'Post record deleted successfully. You can now post this clip again.';
    if (deletedFromYouTube) {
      message = 'Post deleted from ClipForge and YouTube successfully!';
    } else if (deleteFromPlatform && youtubeError) {
      message = `Post record deleted from ClipForge, but failed to delete from YouTube: ${youtubeError}`;
    }

    res.json({ 
      success: true, 
      message,
      clipId: post.clip_id,
      deletedFromYouTube,
      youtubeError
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

// Post clip to Instagram Reels
export const postToInstagram = async (req, res) => {
  let postRecord = null;
  
  try {
    const { clipId, caption } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!clipId) {
      return res.status(400).json({ error: 'Clip ID is required' });
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

    // Get Instagram connection
    const connection = await PlatformConnection.findByUserAndPlatform(userId, 'instagram');
    if (!connection) {
      return res.status(400).json({ 
        error: 'Instagram not connected',
        message: 'Please connect your Instagram account in Settings'
      });
    }

    // Check if connection is expired
    if (PlatformConnection.isTokenExpired(connection)) {
      return res.status(400).json({ 
        error: 'Instagram connection expired',
        message: 'Please reconnect your Instagram account in Settings'
      });
    }

    // Verify clip file exists and get cloud URL
    let videoUrl;
    try {
      // Instagram requires a publicly accessible URL
      if (!clip.cloud_url) {
        throw new Error('Clip must be uploaded to cloud storage first');
      }
      videoUrl = clip.cloud_url;
      logger.info('Using cloud URL for Instagram', { videoUrl, clipId });
    } catch (error) {
      logger.error('Failed to get clip URL', { 
        error: error.message,
        clipId 
      });
      return res.status(404).json({ 
        error: 'Clip not available',
        message: error.message
      });
    }

    // Create post record
    postRecord = await PublishedPost.create({
      userId,
      clipId,
      platform: 'instagram',
      title: clip.title,
      caption: caption?.trim() || clip.title || '',
      status: 'uploading',
      metadata: {}
    });

    logger.info('Starting Instagram upload', { 
      userId, 
      clipId, 
      postId: postRecord.id,
      videoUrl 
    });

    // Import Instagram publishing service
    const { publishToInstagram } = await import('../services/instagramPublishing.js');

    // Publish to Instagram
    const result = await publishToInstagram(
      videoUrl,
      caption?.trim() || clip.title || '',
      connection
    );

    logger.info('Instagram upload successful', { 
      mediaId: result.mediaId,
      permalink: result.permalink,
      postId: postRecord.id
    });

    // Update post record with success
    await PublishedPost.updateStatus(
      postRecord.id,
      'published',
      null,
      result.mediaId,
      result.permalink
    );

    // Update clip status
    await Clip.update(clipId, { status: 'posted' });

    logger.authEvent('INSTAGRAM_POST_SUCCESS', userId, { 
      clipId, 
      mediaId: result.mediaId,
      postId: postRecord.id
    });

    res.json({
      success: true,
      message: 'Clip posted to Instagram Reels successfully!',
      mediaId: result.mediaId,
      permalink: result.permalink,
      post: {
        id: postRecord.id,
        platform: 'instagram',
        status: 'published',
        caption: caption?.trim() || clip.title || '',
        platformVideoId: result.mediaId,
        platform_video_id: result.mediaId,
        platformUrl: result.permalink,
        platform_url: result.permalink,
        clipId: clipId,
        clip_id: clipId
      }
    });

  } catch (error) {
    logger.error('Instagram post error', { 
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      clipId: req.body.clipId
    });

    // Update post record with error if it was created
    if (postRecord) {
      await PublishedPost.updateStatus(
        postRecord.id,
        'failed',
        error.message
      );
    }

    // Handle specific Instagram errors
    let errorMessage = 'Failed to post to Instagram';
    let statusCode = 500;

    if (error.message.includes('Container processing timeout')) {
      errorMessage = 'Instagram is processing your video. This may take a few minutes. Please try again shortly.';
      statusCode = 503;
    } else if (error.message.includes('media container')) {
      errorMessage = 'Failed to upload video to Instagram. Please ensure your video meets Instagram requirements (MP4, H.264, 9:16 aspect ratio, 3-60 seconds).';
      statusCode = 400;
    } else if (error.message.includes('Business Account')) {
      errorMessage = 'Instagram Business Account not found. Please ensure your Instagram account is converted to a Business account.';
      statusCode = 400;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Instagram rate limit reached. Please try again later.';
      statusCode = 429;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      message: error.message,
      details: error.response?.data
    });
  }
};


// Verify if Instagram post still exists
export const verifyInstagramPost = async (req, res) => {
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

    // Only for Instagram posts
    if (post.platform !== 'instagram') {
      return res.status(400).json({ error: 'This endpoint is only for Instagram posts' });
    }

    // Get Instagram connection
    const connection = await PlatformConnection.findByUserAndPlatform(userId, 'instagram');
    if (!connection) {
      return res.status(400).json({ 
        error: 'Instagram not connected',
        message: 'Please reconnect your Instagram account'
      });
    }

    // Check if connection is expired
    if (PlatformConnection.isTokenExpired(connection)) {
      return res.status(400).json({ 
        error: 'Instagram connection expired',
        message: 'Please reconnect your Instagram account'
      });
    }

    // Import Instagram service
    const { refreshInstagramToken } = await import('../services/instagramPublishing.js');
    const axios = (await import('axios')).default;
    
    // Refresh token if needed
    const accessToken = await refreshInstagramToken(connection);

    // Try to get media details
    try {
      const INSTAGRAM_API_VERSION = 'v21.0';
      const response = await axios.get(
        `https://graph.facebook.com/${INSTAGRAM_API_VERSION}/${post.platform_video_id}`,
        {
          params: {
            fields: 'id,media_type,permalink,timestamp,media_url',
            access_token: accessToken
          }
        }
      );

      // Media exists
      logger.info('Instagram post verified', { 
        postId, 
        mediaId: post.platform_video_id
      });

      res.json({
        exists: true,
        message: 'Post exists on Instagram',
        media: {
          id: response.data.id,
          mediaType: response.data.media_type,
          permalink: response.data.permalink,
          timestamp: response.data.timestamp
        }
      });

    } catch (apiError) {
      // Handle Instagram API errors
      if (apiError.response?.status === 404 || 
          apiError.response?.data?.error?.code === 100 ||
          apiError.response?.data?.error?.message?.includes('not found')) {
        // Media deleted
        logger.info('Instagram post not found (deleted)', { 
          postId, 
          mediaId: post.platform_video_id 
        });

        await PublishedPost.updateStatus(postId, 'failed', 'Post deleted from Instagram');
        await Clip.update(post.clip_id, { status: 'completed' });

        return res.json({
          exists: false,
          message: 'Post was deleted from Instagram',
          action: 'Post record updated. You can post this clip again.'
        });
      }

      throw apiError;
    }

  } catch (error) {
    logger.error('Verify Instagram post error', { 
      error: error.message,
      userId: req.user.id,
      postId: req.params.postId
    });

    res.status(500).json({ 
      error: 'Failed to verify post',
      message: error.message 
    });
  }
};
