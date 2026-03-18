import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(apiLimiter);

// Get user dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total videos
    const videosResult = await pool.query(
      'SELECT COUNT(*) FROM videos WHERE user_id = $1',
      [userId]
    );
    const totalVideos = parseInt(videosResult.rows[0].count);

    // Total clips
    const clipsResult = await pool.query(
      'SELECT COUNT(*) FROM clips WHERE user_id = $1',
      [userId]
    );
    const totalClips = parseInt(clipsResult.rows[0].count);

    // Videos by status
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM videos 
       WHERE user_id = $1 
       GROUP BY status`,
      [userId]
    );

    // Recent activity count (last 7 days)
    const recentActivityResult = await pool.query(
      `SELECT COUNT(*) FROM (
        SELECT created_at FROM videos WHERE user_id = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        UNION ALL
        SELECT created_at FROM clips WHERE user_id = $2 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      ) as recent`,
      [userId, userId]
    );
    const recentActivityCount = parseInt(recentActivityResult.rows[0].count);

    // Scheduled posts count
    const scheduledPostsResult = await pool.query(
      `SELECT COUNT(*) FROM published_posts 
       WHERE user_id = $1 
       AND status = 'scheduled' 
       AND is_scheduled = true`,
      [userId]
    );
    const scheduledPosts = parseInt(scheduledPostsResult.rows[0].count);

    res.json({
      totalVideos,
      totalClips,
      scheduledPosts,
      totalViews: 0, // Placeholder for future analytics
      recentActivityCount,
      videosByStatus: statusResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activity feed
router.get('/dashboard/activity', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent videos and clips with activity type
    // PostgreSQL stores timestamps in IST, we need to handle them correctly
    const activityResult = await pool.query(
      `
      (
        SELECT 
          'video' as type,
          v.id,
          v.title,
          v.status,
          v.created_at as created_at,
          v.thumbnail_path,
          v.thumbnail_cloud_url,
          NULL as video_title,
          NULL as viral_score
        FROM videos v
        WHERE v.user_id = $1
      )
      UNION ALL
      (
        SELECT 
          'clip' as type,
          c.id,
          c.title,
          'completed' as status,
          c.created_at as created_at,
          c.thumbnail_path,
          NULL as thumbnail_cloud_url,
          v.title as video_title,
          c.viral_score
        FROM clips c
        JOIN videos v ON c.video_id = v.id
        WHERE c.user_id = $1
      )
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [userId, limit]
    );

    const activities = activityResult.rows.map(activity => {
      let description = '';
      let icon = '';
      let color = '';

      if (activity.type === 'video') {
        switch (activity.status) {
          case 'completed':
            description = `Video "${activity.title}" processed successfully`;
            icon = '✅';
            color = 'green';
            break;
          case 'processing':
            description = `Video "${activity.title}" is being processed`;
            icon = '⏳';
            color = 'blue';
            break;
          case 'failed':
            description = `Video "${activity.title}" processing failed`;
            icon = '❌';
            color = 'red';
            break;
          default:
            description = `Video "${activity.title}" uploaded`;
            icon = '📤';
            color = 'gray';
        }
      } else if (activity.type === 'clip') {
        description = `Clip "${activity.title}" generated from "${activity.video_title}"`;
        icon = '✂️';
        color = 'purple';
        
        // Check viral score (stored as decimal 0.00-1.00)
        if (activity.viral_score && activity.viral_score >= 0.80) {
          icon = '🔥';
          color = 'orange';
        }
      }

      // Handle timezone conversion properly
      // Old records were stored in IST when timezone was set to Asia/Kolkata
      // New records will be stored in UTC after we removed timezone setting
      // We need to detect and handle both cases
      
      let timestamp;
      const now = new Date();
      const dbDate = activity.created_at instanceof Date 
        ? activity.created_at 
        : new Date(activity.created_at);
      
      // Calculate time difference
      const diffHours = (now - dbDate) / (1000 * 60 * 60);
      
      // If difference is around 5-6 hours, it's likely an IST timestamp being read as UTC
      // Add 5.5 hours to correct it
      if (diffHours > 5 && diffHours < 7) {
        const correctedDate = new Date(dbDate.getTime() + (5.5 * 60 * 60 * 1000));
        timestamp = correctedDate.toISOString();
      } else {
        // For new records or if difference is reasonable, use as-is
        timestamp = dbDate.toISOString();
      }

      return {
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description,
        icon,
        color,
        timestamp: timestamp,
        thumbnailPath: activity.thumbnail_path,
        thumbnailUrl: activity.thumbnail_cloud_url || null,
        viralScore: activity.viral_score ? Number(activity.viral_score).toFixed(0) + '%' : null,
        _debug: {
          dbRawTimestamp: activity.created_at?.toString(),
          dbDate: dbDate.toISOString(),
          correctedTimestamp: timestamp,
          diffHours: diffHours.toFixed(2),
          serverNow: now.toISOString(),
          wasAdjusted: diffHours > 5 && diffHours < 7
        }
      };
    });

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ message: 'Failed to fetch activity feed' });
  }
});

// Get user's top performing clips
router.get('/dashboard/top-clips', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const clipsResult = await pool.query(
      `SELECT 
        c.*,
        v.title as video_title
      FROM clips c
      JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1
      ORDER BY c.viral_score DESC NULLS LAST, c.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({ clips: clipsResult.rows });
  } catch (error) {
    console.error('Error fetching top clips:', error);
    res.status(500).json({ message: 'Failed to fetch top clips' });
  }
});

// Get user's recent videos
router.get('/dashboard/recent-videos', async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const videosResult = await pool.query(
      `SELECT 
        v.*,
        COUNT(c.id) as clip_count
      FROM videos v
      LEFT JOIN clips c ON v.id = c.video_id
      WHERE v.user_id = $1
      GROUP BY v.id
      ORDER BY v.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    res.json({ videos: videosResult.rows });
  } catch (error) {
    console.error('Error fetching recent videos:', error);
    res.status(500).json({ message: 'Failed to fetch recent videos' });
  }
});

export default router;
