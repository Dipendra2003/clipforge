import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(apiLimiter);

// Get dashboard metrics
router.get('/metrics', async (req, res) => {
  try {
    // Total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Active users (users who logged in within last 30 days)
    const activeUsersResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) 
      FROM sessions 
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
    `);
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // Total videos processed
    const videosResult = await pool.query(`
      SELECT COUNT(*) FROM videos WHERE status = 'completed'
    `);
    const videosProcessed = parseInt(videosResult.rows[0].count);

    // Total clips generated
    const clipsResult = await pool.query('SELECT COUNT(*) FROM clips');
    const totalClips = parseInt(clipsResult.rows[0].count);

    // Calculate revenue (placeholder - integrate with actual payment system)
    // For now, we'll use a simple calculation based on user count
    const revenue = totalUsers * 0; // Update when payment system is integrated

    res.json({
      totalUsers,
      activeUsers,
      videosProcessed,
      totalClips,
      revenue
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
});

// Get user growth data (last 30 days)
router.get('/user-growth', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user growth:', error);
    res.status(500).json({ message: 'Failed to fetch user growth data' });
  }
});

// Get video processing stats (last 30 days)
router.get('/video-stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM videos
      WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching video stats:', error);
    res.status(500).json({ message: 'Failed to fetch video statistics' });
  }
});

// Enhanced overview stats
router.get('/stats/overview', async (req, res) => {
  try {
    // Total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Active users today
    const activeUsersTodayResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) 
      FROM sessions 
      WHERE created_at >= CURRENT_DATE
    `);
    const activeUsersToday = parseInt(activeUsersTodayResult.rows[0].count);

    // Active users last 7 days
    const activeUsers7DaysResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) 
      FROM sessions 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const activeUsers7Days = parseInt(activeUsers7DaysResult.rows[0].count);

    // Total videos
    const videosResult = await pool.query('SELECT COUNT(*) FROM videos');
    const totalVideos = parseInt(videosResult.rows[0].count);

    // Total clips
    const clipsResult = await pool.query('SELECT COUNT(*) FROM clips');
    const totalClips = parseInt(clipsResult.rows[0].count);

    // Total posts
    const postsResult = await pool.query('SELECT COUNT(*) FROM published_posts');
    const totalPosts = parseInt(postsResult.rows[0].count);

    // Scheduled posts
    const scheduledResult = await pool.query(`
      SELECT COUNT(*) FROM published_posts 
      WHERE status = 'scheduled' AND is_scheduled = true
    `);
    const scheduledPosts = parseInt(scheduledResult.rows[0].count);

    res.json({
      totalUsers,
      activeUsersToday,
      activeUsers7Days,
      totalVideos,
      totalClips,
      totalPosts,
      scheduledPosts
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Failed to fetch overview statistics' });
  }
});

// User insights
router.get('/stats/users', async (req, res) => {
  try {
    // New vs returning users (last 30 days)
    const newVsReturningResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN session_count = 1 THEN 1 END) as new_users,
        COUNT(CASE WHEN session_count > 1 THEN 1 END) as returning_users
      FROM (
        SELECT user_id, COUNT(*) as session_count 
        FROM sessions 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY user_id
      ) subquery
    `);
    const newVsReturning = newVsReturningResult.rows[0];

    // Top users by uploads
    const topUsersResult = await pool.query(`
      SELECT u.id, u.name, u.email, COUNT(v.id) as video_count
      FROM users u
      LEFT JOIN videos v ON u.id = v.user_id
      GROUP BY u.id
      HAVING COUNT(v.id) > 0
      ORDER BY video_count DESC
      LIMIT 10
    `);
    const topUsers = topUsersResult.rows;

    // User growth trend (last 30 days)
    const growthTrendResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const growthTrend = growthTrendResult.rows;

    res.json({
      newVsReturning: {
        newUsers: parseInt(newVsReturning.new_users) || 0,
        returningUsers: parseInt(newVsReturning.returning_users) || 0
      },
      topUsers,
      growthTrend
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// Content insights
router.get('/stats/content', async (req, res) => {
  try {
    // Top videos by clip count
    const topVideosResult = await pool.query(`
      SELECT v.id, v.title, v.user_id, u.name as user_name, COUNT(c.id) as clip_count
      FROM videos v
      LEFT JOIN clips c ON v.id = c.video_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.status = 'completed'
      GROUP BY v.id, u.name
      HAVING COUNT(c.id) > 0
      ORDER BY clip_count DESC
      LIMIT 10
    `);
    const topVideos = topVideosResult.rows;

    // Viral score distribution
    const viralScoreResult = await pool.query(`
      SELECT 
        CASE 
          WHEN viral_score >= 70 THEN 'High'
          WHEN viral_score >= 40 THEN 'Medium'
          ELSE 'Low'
        END as score_range,
        COUNT(*) as count
      FROM clips
      WHERE viral_score IS NOT NULL
      GROUP BY score_range
    `);
    const viralScoreDistribution = viralScoreResult.rows;

    // Emotion distribution
    const emotionResult = await pool.query(`
      SELECT emotion, COUNT(*) as count
      FROM clips
      WHERE emotion IS NOT NULL
      GROUP BY emotion
      ORDER BY count DESC
      LIMIT 10
    `);
    const emotionDistribution = emotionResult.rows;

    // Clip generation trend (last 30 days)
    const clipTrendResult = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM clips
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const clipTrend = clipTrendResult.rows;

    res.json({
      topVideos,
      viralScoreDistribution,
      emotionDistribution,
      clipTrend
    });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({ message: 'Failed to fetch content statistics' });
  }
});

// Platform performance
router.get('/stats/platform', async (req, res) => {
  try {
    // Posts by platform and status
    const postsByPlatformResult = await pool.query(`
      SELECT platform, status, COUNT(*) as count
      FROM published_posts
      GROUP BY platform, status
    `);
    const postsByPlatform = postsByPlatformResult.rows;

    // Posting success rate
    const successRateResult = await pool.query(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        ROUND(100.0 * SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as success_rate
      FROM published_posts
      WHERE status IN ('published', 'failed')
    `);
    const successRate = successRateResult.rows[0];

    // Platform connections status
    const connectionsResult = await pool.query(`
      SELECT 
        platform,
        COUNT(*) as total_connections,
        SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN expires_at <= NOW() THEN 1 ELSE 0 END) as expired
      FROM platform_connections
      GROUP BY platform
    `);
    const connections = connectionsResult.rows;

    // Posting activity trend (last 30 days)
    const postingTrendResult = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM published_posts
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    const postingTrend = postingTrendResult.rows;

    res.json({
      postsByPlatform,
      successRate: {
        totalPosts: parseInt(successRate.total_posts) || 0,
        successful: parseInt(successRate.successful) || 0,
        failed: parseInt(successRate.failed) || 0,
        successRate: parseFloat(successRate.success_rate) || 0
      },
      connections,
      postingTrend
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Failed to fetch platform statistics' });
  }
});

// Scheduling insights
router.get('/stats/scheduling', async (req, res) => {
  try {
    // Total scheduled posts
    const totalScheduledResult = await pool.query(`
      SELECT COUNT(*) FROM published_posts 
      WHERE status = 'scheduled' AND is_scheduled = true
    `);
    const totalScheduled = parseInt(totalScheduledResult.rows[0].count);

    // Upcoming scheduled (next 7 days)
    const upcomingResult = await pool.query(`
      SELECT COUNT(*) FROM published_posts 
      WHERE status = 'scheduled' 
        AND is_scheduled = true 
        AND scheduled_for BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    `);
    const upcomingScheduled = parseInt(upcomingResult.rows[0].count);

    // Failed scheduled posts
    const failedScheduledResult = await pool.query(`
      SELECT COUNT(*) FROM published_posts 
      WHERE status = 'failed' AND is_scheduled = true
    `);
    const failedScheduled = parseInt(failedScheduledResult.rows[0].count);

    // Scheduled vs immediate posts
    const scheduledVsImmediateResult = await pool.query(`
      SELECT 
        SUM(CASE WHEN is_scheduled = true THEN 1 ELSE 0 END) as scheduled_posts,
        SUM(CASE WHEN is_scheduled = false THEN 1 ELSE 0 END) as immediate_posts
      FROM published_posts
      WHERE status = 'published'
    `);
    const scheduledVsImmediate = scheduledVsImmediateResult.rows[0];

    // Upcoming posts details
    const upcomingPostsResult = await pool.query(`
      SELECT pp.id, pp.title, pp.platform, pp.scheduled_for, c.title as clip_title
      FROM published_posts pp
      JOIN clips c ON pp.clip_id = c.id
      WHERE pp.status = 'scheduled' 
        AND pp.is_scheduled = true 
        AND pp.scheduled_for BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      ORDER BY pp.scheduled_for ASC
      LIMIT 10
    `);
    const upcomingPosts = upcomingPostsResult.rows;

    res.json({
      totalScheduled,
      upcomingScheduled,
      failedScheduled,
      scheduledVsImmediate: {
        scheduled: parseInt(scheduledVsImmediate.scheduled_posts) || 0,
        immediate: parseInt(scheduledVsImmediate.immediate_posts) || 0
      },
      upcomingPosts
    });
  } catch (error) {
    console.error('Error fetching scheduling stats:', error);
    res.status(500).json({ message: 'Failed to fetch scheduling statistics' });
  }
});

// Errors and alerts
router.get('/stats/errors', async (req, res) => {
  try {
    // Recent failed video uploads
    const failedVideosResult = await pool.query(`
      SELECT id, title, error_message, created_at, user_id
      FROM videos
      WHERE status = 'failed'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    const failedVideos = failedVideosResult.rows;

    // Recent failed posts
    const failedPostsResult = await pool.query(`
      SELECT pp.id, pp.title, pp.platform, pp.error_message, pp.created_at, pp.user_id
      FROM published_posts pp
      WHERE pp.status = 'failed'
      ORDER BY pp.created_at DESC
      LIMIT 10
    `);
    const failedPosts = failedPostsResult.rows;

    // Error counts
    const errorCountsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM videos WHERE status = 'failed') as failed_videos,
        (SELECT COUNT(*) FROM published_posts WHERE status = 'failed') as failed_posts
    `);
    const errorCounts = errorCountsResult.rows[0];

    res.json({
      failedVideos,
      failedPosts,
      errorCounts: {
        failedVideos: parseInt(errorCounts.failed_videos) || 0,
        failedPosts: parseInt(errorCounts.failed_posts) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching error stats:', error);
    res.status(500).json({ message: 'Failed to fetch error statistics' });
  }
});

// System health
router.get('/stats/system', async (req, res) => {
  try {
    // Database connection test
    let dbStatus = 'healthy';
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      dbStatus = 'unhealthy';
    }

    // Storage usage
    const storageResult = await pool.query(`
      SELECT 
        COALESCE(SUM(file_size), 0) as total_storage,
        COUNT(*) as total_files
      FROM videos
    `);
    const storage = storageResult.rows[0];

    // Average processing time (videos completed in last 7 days)
    const processingTimeResult = await pool.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_seconds
      FROM videos
      WHERE status = 'completed' 
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const avgProcessingTime = parseFloat(processingTimeResult.rows[0].avg_processing_seconds) || 0;

    res.json({
      database: {
        status: dbStatus,
        connected: dbStatus === 'healthy'
      },
      storage: {
        totalBytes: parseInt(storage.total_storage) || 0,
        totalFiles: parseInt(storage.total_files) || 0,
        formatted: formatBytes(parseInt(storage.total_storage) || 0)
      },
      performance: {
        avgProcessingTimeSeconds: Math.round(avgProcessingTime),
        avgProcessingTimeFormatted: formatDuration(Math.round(avgProcessingTime))
      }
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch system statistics',
      database: { status: 'unhealthy', connected: false }
    });
  }
});

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const usersResult = await pool.query(`
      SELECT 
        id, name, email, role, email_verified, 
        google_id IS NOT NULL as has_google_auth,
        created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);

    res.json({
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get platform analytics summary
router.get('/analytics', async (req, res) => {
  try {
    // Storage usage
    const storageResult = await pool.query(`
      SELECT COALESCE(SUM(file_size), 0) as total_storage
      FROM videos
    `);
    const totalStorage = parseInt(storageResult.rows[0].total_storage);

    // Average video duration
    const durationResult = await pool.query(`
      SELECT AVG(duration) as avg_duration
      FROM videos
      WHERE duration > 0
    `);
    const avgDuration = parseFloat(durationResult.rows[0].avg_duration) || 0;

    // Videos by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM videos
      GROUP BY status
    `);

    // User roles distribution
    const rolesResult = await pool.query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    res.json({
      storage: {
        total: totalStorage,
        formatted: formatBytes(totalStorage)
      },
      avgVideoDuration: Math.round(avgDuration),
      videosByStatus: statusResult.rows,
      usersByRole: rolesResult.rows
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to format duration
function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default router;
