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

export default router;
