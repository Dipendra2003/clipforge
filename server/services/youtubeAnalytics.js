import { google } from 'googleapis';
import PlatformConnection from '../models/PlatformConnection.js';
import PublishedPost from '../models/PublishedPost.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

/**
 * Refresh YouTube access token if expired
 */
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

    logger.info('YouTube token refreshed for analytics', { userId: connection.user_id });

    return credentials.access_token;
  } catch (error) {
    logger.error('Token refresh error in analytics', { 
      error: error.message,
      userId: connection.user_id 
    });
    throw error;
  }
}

/**
 * Fetch YouTube video statistics using YouTube Data API v3
 * Includes advanced metrics like watch time and engagement
 */
async function fetchYouTubeVideoStats(videoId, accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Fetch video statistics
    const response = await youtube.videos.list({
      part: ['statistics', 'contentDetails'],
      id: [videoId]
    });

    if (!response.data.items || response.data.items.length === 0) {
      logger.warn('Video not found on YouTube', { videoId });
      return null;
    }

    const video = response.data.items[0];
    const stats = video.statistics;
    const contentDetails = video.contentDetails;

    // Parse duration (ISO 8601 format: PT1M30S = 90 seconds)
    const duration = parseDuration(contentDetails.duration);

    // Calculate estimated average view duration
    // For YouTube Shorts (< 60s), typical retention is 50-70%
    // For longer videos, it's typically 30-50%
    const estimatedRetention = duration <= 60 ? 0.6 : 0.4;
    const avgViewDuration = duration > 0 ? (duration * estimatedRetention).toFixed(2) : 0;

    // Calculate estimated watch time (total minutes watched)
    const viewCount = parseInt(stats.viewCount || 0);
    const totalWatchTimeSeconds = viewCount * parseFloat(avgViewDuration);

    return {
      viewCount: viewCount,
      likeCount: parseInt(stats.likeCount || 0),
      dislikeCount: 0, // YouTube API no longer provides dislike counts (removed in 2021)
      commentCount: parseInt(stats.commentCount || 0),
      // YouTube API doesn't provide shares directly
      shareCount: 0,
      duration: duration,
      avgViewDuration: parseFloat(avgViewDuration),
      totalWatchTimeSeconds: Math.round(totalWatchTimeSeconds)
    };
  } catch (error) {
    logger.error('Failed to fetch YouTube video stats', { 
      error: error.message,
      videoId,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT1M30S = 90 seconds, PT1H2M3S = 3723 seconds
 */
function parseDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Sync analytics for a single published post
 */
async function syncPostAnalytics(post, connection) {
  try {
    // Check if token is expired
    let accessToken = connection.access_token;
    if (PlatformConnection.isTokenExpired(connection)) {
      accessToken = await refreshYouTubeToken(connection);
    }

    // Fetch stats from YouTube
    const stats = await fetchYouTubeVideoStats(post.platform_video_id, accessToken);

    if (!stats) {
      logger.warn('No stats returned for post', { postId: post.id });
      return false;
    }

    // Update published_posts table with all metrics
    await pool.query(`
      UPDATE published_posts
      SET 
        views_count = $1,
        likes_count = $2,
        dislikes_count = $3,
        comments_count = $4,
        shares_count = $5,
        avg_view_duration = $6,
        watch_time_seconds = $7,
        last_synced_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [
      stats.viewCount,
      stats.likeCount,
      stats.dislikeCount,
      stats.commentCount,
      stats.shareCount,
      stats.avgViewDuration,
      stats.totalWatchTimeSeconds,
      post.id
    ]);

    // Create daily snapshot
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO analytics_snapshots (
        post_id, snapshot_date, views_count, likes_count, 
        dislikes_count, comments_count, shares_count, watch_time_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (post_id, snapshot_date)
      DO UPDATE SET
        views_count = EXCLUDED.views_count,
        likes_count = EXCLUDED.likes_count,
        dislikes_count = EXCLUDED.dislikes_count,
        comments_count = EXCLUDED.comments_count,
        shares_count = EXCLUDED.shares_count,
        watch_time_seconds = EXCLUDED.watch_time_seconds
    `, [
      post.id,
      today,
      stats.viewCount,
      stats.likeCount,
      stats.dislikeCount,
      stats.commentCount,
      stats.shareCount,
      stats.totalWatchTimeSeconds
    ]);

    logger.info('Analytics synced for post', { 
      postId: post.id,
      videoId: post.platform_video_id,
      views: stats.viewCount,
      likes: stats.likeCount,
      watchTime: stats.totalWatchTimeSeconds
    });

    return true;
  } catch (error) {
    logger.error('Failed to sync post analytics', { 
      error: error.message,
      postId: post.id,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Sync analytics for all published posts of a user
 */
export async function syncUserAnalytics(userId) {
  try {
    logger.info('Starting analytics sync for user', { userId });

    // Get YouTube connection
    const connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
    if (!connection) {
      logger.warn('No YouTube connection found for user', { userId });
      return { success: false, message: 'YouTube not connected' };
    }

    // Get all published YouTube posts
    const posts = await pool.query(`
      SELECT * FROM published_posts
      WHERE user_id = $1
      AND platform = 'youtube'
      AND status = 'published'
      AND platform_video_id IS NOT NULL
      ORDER BY created_at DESC
    `, [userId]);

    if (posts.rows.length === 0) {
      logger.info('No published posts to sync', { userId });
      return { success: true, synced: 0, message: 'No posts to sync' };
    }

    let syncedCount = 0;
    let failedCount = 0;

    // Sync each post
    for (const post of posts.rows) {
      const success = await syncPostAnalytics(post, connection);
      if (success) {
        syncedCount++;
      } else {
        failedCount++;
      }

      // Add delay to avoid rate limiting (YouTube API quota)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Analytics sync completed', { 
      userId, 
      synced: syncedCount, 
      failed: failedCount 
    });

    return { 
      success: true, 
      synced: syncedCount, 
      failed: failedCount,
      total: posts.rows.length
    };
  } catch (error) {
    logger.error('Analytics sync failed', { error: error.message, userId });
    return { success: false, message: error.message };
  }
}

/**
 * Sync analytics for all users (cron job)
 */
export async function syncAllUsersAnalytics() {
  try {
    logger.info('Starting analytics sync for all users');

    // Get all users with YouTube connections
    const result = await pool.query(`
      SELECT DISTINCT user_id
      FROM platform_connections
      WHERE platform = 'youtube'
    `);

    const userIds = result.rows.map(row => row.user_id);
    logger.info(`Found ${userIds.length} users with YouTube connections`);

    let totalSynced = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const syncResult = await syncUserAnalytics(userId);
      if (syncResult.success) {
        totalSynced += syncResult.synced || 0;
        totalFailed += syncResult.failed || 0;
      }

      // Add delay between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('All users analytics sync completed', { 
      users: userIds.length,
      totalSynced,
      totalFailed
    });

    return { 
      success: true, 
      users: userIds.length,
      synced: totalSynced,
      failed: totalFailed
    };
  } catch (error) {
    logger.error('All users analytics sync failed', { error: error.message });
    return { success: false, message: error.message };
  }
}

export default {
  syncUserAnalytics,
  syncAllUsersAnalytics,
  fetchYouTubeVideoStats
};
