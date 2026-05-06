import PlatformConnection from '../models/PlatformConnection.js';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Instagram Analytics Service
 * Handles fetching and syncing Instagram Reels analytics
 */

const INSTAGRAM_API_VERSION = 'v21.0';
const INSTAGRAM_GRAPH_API_URL = `https://graph.facebook.com/${INSTAGRAM_API_VERSION}`;

/**
 * Refresh Instagram access token if needed
 */
async function refreshInstagramToken(connection) {
  try {
    // Instagram uses long-lived tokens (60 days)
    // Check if token needs refresh (within 7 days of expiry)
    const daysUntilExpiry = Math.floor((new Date(connection.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry > 7) {
      return connection.access_token;
    }

    // Refresh the long-lived token
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API_URL}/oauth/access_token?` +
      `grant_type=ig_refresh_token&` +
      `access_token=${connection.access_token}`
    );

    if (!response.ok) {
      throw new Error('Failed to refresh Instagram token');
    }

    const data = await response.json();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);

    await PlatformConnection.updateTokens(
      connection.user_id,
      'instagram',
      data.access_token,
      expiresAt
    );

    logger.info('Instagram token refreshed', { userId: connection.user_id });
    return data.access_token;
  } catch (error) {
    logger.error('Instagram token refresh error', {
      error: error.message,
      userId: connection.user_id
    });
    throw error;
  }
}

/**
 * Fetch Instagram Reel insights
 * Available metrics: plays, reach, likes, comments, shares, saved
 */
async function fetchInstagramReelInsights(mediaId, accessToken) {
  try {
    // Get media insights
    const insightsUrl = `${INSTAGRAM_GRAPH_API_URL}/${mediaId}/insights?` +
      `metric=plays,reach,likes,comments,shares,saved,total_interactions&` +
      `access_token=${accessToken}`;

    const response = await fetch(insightsUrl);

    if (!response.ok) {
      const error = await response.json();
      logger.error('Instagram API error', { error, mediaId });
      throw new Error(error.error?.message || 'Failed to fetch Instagram insights');
    }

    const data = await response.json();
    const insights = {};

    // Parse insights data
    data.data.forEach(metric => {
      insights[metric.name] = metric.values[0].value;
    });

    // Get media details (duration)
    const mediaUrl = `${INSTAGRAM_GRAPH_API_URL}/${mediaId}?` +
      `fields=media_type,media_url,thumbnail_url,timestamp,duration&` +
      `access_token=${accessToken}`;

    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    return {
      viewCount: insights.plays || 0,
      reach: insights.reach || 0,
      likeCount: insights.likes || 0,
      commentCount: insights.comments || 0,
      shareCount: insights.shares || 0,
      savedCount: insights.saved || 0,
      totalInteractions: insights.total_interactions || 0,
      duration: mediaData.duration || 0,
      timestamp: mediaData.timestamp
    };
  } catch (error) {
    logger.error('Failed to fetch Instagram reel insights', {
      error: error.message,
      mediaId
    });
    throw error;
  }
}

/**
 * Sync analytics for a single Instagram post
 */
async function syncInstagramPostAnalytics(post, connection) {
  try {
    // Refresh token if needed
    const accessToken = await refreshInstagramToken(connection);

    // Fetch insights from Instagram
    const insights = await fetchInstagramReelInsights(post.platform_video_id, accessToken);

    if (!insights) {
      logger.warn('No insights returned for Instagram post', { postId: post.id });
      return false;
    }

    // Calculate average view duration (estimated at 70% for Reels)
    const avgViewDuration = insights.duration > 0 ? (insights.duration * 0.7).toFixed(2) : 0;
    const totalWatchTimeSeconds = Math.round(insights.viewCount * parseFloat(avgViewDuration));

    // Update published_posts table
    await pool.query(`
      UPDATE published_posts
      SET 
        views_count = $1,
        likes_count = $2,
        comments_count = $3,
        shares_count = $4,
        avg_view_duration = $5,
        watch_time_seconds = $6,
        reach_count = $7,
        saved_count = $8,
        last_synced_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [
      insights.viewCount,
      insights.likeCount,
      insights.commentCount,
      insights.shareCount,
      avgViewDuration,
      totalWatchTimeSeconds,
      insights.reach,
      insights.savedCount,
      post.id
    ]);

    // Create daily snapshot
    const today = new Date().toISOString().split('T')[0];
    await pool.query(`
      INSERT INTO analytics_snapshots (
        post_id, snapshot_date, views_count, likes_count, 
        comments_count, shares_count, watch_time_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (post_id, snapshot_date)
      DO UPDATE SET
        views_count = EXCLUDED.views_count,
        likes_count = EXCLUDED.likes_count,
        comments_count = EXCLUDED.comments_count,
        shares_count = EXCLUDED.shares_count,
        watch_time_seconds = EXCLUDED.watch_time_seconds
    `, [
      post.id,
      today,
      insights.viewCount,
      insights.likeCount,
      insights.commentCount,
      insights.shareCount,
      totalWatchTimeSeconds
    ]);

    logger.info('Instagram analytics synced for post', {
      postId: post.id,
      mediaId: post.platform_video_id,
      plays: insights.viewCount,
      likes: insights.likeCount,
      reach: insights.reach
    });

    return true;
  } catch (error) {
    logger.error('Failed to sync Instagram post analytics', {
      error: error.message,
      postId: post.id,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Sync analytics for all Instagram posts of a user
 */
export async function syncUserInstagramAnalytics(userId) {
  try {
    logger.info('Starting Instagram analytics sync for user', { userId });

    // Get Instagram connection
    const connection = await PlatformConnection.findByUserAndPlatform(userId, 'instagram');
    if (!connection) {
      logger.warn('No Instagram connection found for user', { userId });
      return { success: false, message: 'Instagram not connected' };
    }

    // Get all published Instagram posts
    const posts = await pool.query(`
      SELECT * FROM published_posts
      WHERE user_id = $1
      AND platform = 'instagram'
      AND status = 'published'
      AND platform_video_id IS NOT NULL
      ORDER BY created_at DESC
    `, [userId]);

    if (posts.rows.length === 0) {
      logger.info('No published Instagram posts to sync', { userId });
      return { success: true, synced: 0, message: 'No posts to sync' };
    }

    let syncedCount = 0;
    let failedCount = 0;

    // Sync each post
    for (const post of posts.rows) {
      const success = await syncInstagramPostAnalytics(post, connection);
      if (success) {
        syncedCount++;
      } else {
        failedCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info('Instagram analytics sync completed', {
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
    logger.error('Instagram analytics sync failed', { error: error.message, userId });
    return { success: false, message: error.message };
  }
}

/**
 * Sync analytics for all users with Instagram connections
 */
export async function syncAllUsersInstagramAnalytics() {
  try {
    logger.info('Starting Instagram analytics sync for all users');

    // Get all users with Instagram connections
    const result = await pool.query(`
      SELECT DISTINCT user_id
      FROM platform_connections
      WHERE platform = 'instagram'
    `);

    const userIds = result.rows.map(row => row.user_id);
    logger.info(`Found ${userIds.length} users with Instagram connections`);

    let totalSynced = 0;
    let totalFailed = 0;

    for (const userId of userIds) {
      const syncResult = await syncUserInstagramAnalytics(userId);
      if (syncResult.success) {
        totalSynced += syncResult.synced || 0;
        totalFailed += syncResult.failed || 0;
      }

      // Add delay between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('All users Instagram analytics sync completed', {
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
    logger.error('All users Instagram analytics sync failed', { error: error.message });
    return { success: false, message: error.message };
  }
}

export default {
  syncUserInstagramAnalytics,
  syncAllUsersInstagramAnalytics,
  fetchInstagramReelInsights
};
