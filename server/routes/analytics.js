import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { analyticsLimiter } from '../middleware/rateLimiter.js';
import { syncUserAnalytics } from '../services/youtubeAnalytics.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(analyticsLimiter); // Use more generous limiter for analytics

/**
 * GET /api/analytics/overview
 * Get analytics overview for user
 */
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get total views, likes, comments, shares from all published posts
    const totalsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(comments_count), 0) as total_comments,
        COALESCE(SUM(shares_count), 0) as total_shares,
        COUNT(*) as total_posts
      FROM published_posts
      WHERE user_id = $1
      AND status = 'published'
      AND platform_video_id IS NOT NULL
    `, [userId]);

    const totals = totalsResult.rows[0];

    // Calculate engagement rate
    // Engagement = (likes + comments) / views * 100
    // Note: shares not available from YouTube Data API v3
    const totalEngagements = parseInt(totals.total_likes) + 
                            parseInt(totals.total_comments);
    const totalViews = parseInt(totals.total_views);
    const engagementRate = totalViews > 0 
      ? ((totalEngagements / totalViews) * 100).toFixed(2)
      : 0;
    
    // Check if user has any published posts
    const hasPublishedPosts = parseInt(totals.total_posts) > 0;

    // Get previous period data (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Current period (last 30 days)
    const currentPeriodResult = await pool.query(`
      SELECT 
        COALESCE(SUM(views_count), 0) as views,
        COALESCE(SUM(likes_count), 0) as likes,
        COALESCE(SUM(comments_count), 0) as comments
      FROM published_posts
      WHERE user_id = $1
      AND status = 'published'
      AND created_at >= $2
    `, [userId, thirtyDaysAgo]);

    // Previous period (30-60 days ago)
    const previousPeriodResult = await pool.query(`
      SELECT 
        COALESCE(SUM(views_count), 0) as views,
        COALESCE(SUM(likes_count), 0) as likes,
        COALESCE(SUM(comments_count), 0) as comments
      FROM published_posts
      WHERE user_id = $1
      AND status = 'published'
      AND created_at >= $2
      AND created_at < $3
    `, [userId, sixtyDaysAgo, thirtyDaysAgo]);

    const currentPeriod = currentPeriodResult.rows[0];
    const previousPeriod = previousPeriodResult.rows[0];

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      const curr = parseInt(current);
      const prev = parseInt(previous);
      if (prev === 0) return curr > 0 ? 100 : 0;
      return (((curr - prev) / prev) * 100).toFixed(1);
    };

    const viewsChange = calculateChange(currentPeriod.views, previousPeriod.views);
    const likesChange = calculateChange(currentPeriod.likes, previousPeriod.likes);
    const commentsChange = calculateChange(currentPeriod.comments, previousPeriod.comments);

    // Get last sync time
    const lastSyncResult = await pool.query(`
      SELECT MAX(last_synced_at) as last_sync
      FROM published_posts
      WHERE user_id = $1
    `, [userId]);

    const lastSync = lastSyncResult.rows[0].last_sync;

    res.json({
      totalViews: parseInt(totals.total_views),
      totalLikes: parseInt(totals.total_likes),
      totalComments: parseInt(totals.total_comments),
      totalShares: parseInt(totals.total_shares),
      totalPosts: parseInt(totals.total_posts),
      engagementRate: parseFloat(engagementRate),
      changes: {
        views: parseFloat(viewsChange),
        likes: parseFloat(likesChange),
        comments: parseFloat(commentsChange)
      },
      lastSyncedAt: lastSync,
      period: 'last_30_days',
      hasData: hasPublishedPosts
    });

  } catch (error) {
    logger.error('Analytics overview error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch analytics overview' });
  }
});

/**
 * GET /api/analytics/timeseries
 * Get time-series analytics data
 */
router.get('/timeseries', async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Get daily snapshots
    const snapshotsResult = await pool.query(`
      SELECT 
        snapshot_date as date,
        SUM(views_count) as views,
        SUM(likes_count) as likes,
        SUM(comments_count) as comments,
        SUM(shares_count) as shares
      FROM analytics_snapshots
      WHERE post_id IN (
        SELECT id FROM published_posts WHERE user_id = $1
      )
      AND snapshot_date >= $2
      GROUP BY snapshot_date
      ORDER BY snapshot_date ASC
    `, [userId, daysAgo.toISOString().split('T')[0]]);

    // Fill in missing dates with zeros
    const data = [];
    const currentDate = new Date(daysAgo);
    const today = new Date();

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const snapshot = snapshotsResult.rows.find(row => 
        row.date.toISOString().split('T')[0] === dateStr
      );

      data.push({
        date: dateStr,
        views: snapshot ? parseInt(snapshot.views) : 0,
        likes: snapshot ? parseInt(snapshot.likes) : 0,
        comments: snapshot ? parseInt(snapshot.comments) : 0,
        shares: snapshot ? parseInt(snapshot.shares) : 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ data });

  } catch (error) {
    logger.error('Analytics timeseries error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch timeseries data' });
  }
});

/**
 * GET /api/analytics/top-clips
 * Get top performing clips
 */
router.get('/top-clips', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, sortBy = 'views' } = req.query;

    // Validate sortBy parameter
    const validSortFields = ['views', 'likes', 'comments', 'engagement'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'views';

    let orderByClause;
    if (sortField === 'engagement') {
      orderByClause = '(pp.likes_count + pp.comments_count + pp.shares_count) DESC';
    } else {
      orderByClause = `pp.${sortField}_count DESC`;
    }

    const clipsResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.thumbnail_path,
        c.cloud_url,
        c.viral_score,
        c.emotion,
        c.duration,
        pp.views_count as views,
        pp.likes_count as likes,
        pp.comments_count as comments,
        pp.shares_count as shares,
        pp.platform_url,
        pp.platform_video_id,
        pp.created_at as published_at,
        CASE 
          WHEN pp.views_count > 0 
          THEN ((pp.likes_count + pp.comments_count + pp.shares_count)::float / pp.views_count * 100)
          ELSE 0 
        END as engagement_rate
      FROM clips c
      JOIN published_posts pp ON c.id = pp.clip_id
      WHERE c.user_id = $1
      AND pp.status = 'published'
      AND pp.platform_video_id IS NOT NULL
      ORDER BY ${orderByClause}
      LIMIT $2
    `, [userId, parseInt(limit)]);

    const clips = clipsResult.rows.map(clip => ({
      id: clip.id,
      title: clip.title,
      thumbnailPath: clip.thumbnail_path,
      thumbnailUrl: clip.cloud_url,
      viralScore: clip.viral_score ? parseFloat(clip.viral_score) : null,
      emotion: clip.emotion,
      duration: clip.duration,
      views: parseInt(clip.views),
      likes: parseInt(clip.likes),
      comments: parseInt(clip.comments),
      shares: parseInt(clip.shares),
      engagementRate: parseFloat(clip.engagement_rate).toFixed(2),
      platformUrl: clip.platform_url,
      platformVideoId: clip.platform_video_id,
      publishedAt: clip.published_at
    }));

    res.json({ clips });

  } catch (error) {
    logger.error('Analytics top clips error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch top clips' });
  }
});

/**
 * GET /api/analytics/platform
 * Get platform-wise analytics
 */
router.get('/platform', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get YouTube stats
    const youtubeResult = await pool.query(`
      SELECT 
        COUNT(*) as posts_count,
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(comments_count), 0) as total_comments,
        COALESCE(SUM(shares_count), 0) as total_shares,
        COALESCE(AVG(views_count), 0) as avg_views,
        COALESCE(AVG(likes_count), 0) as avg_likes
      FROM published_posts
      WHERE user_id = $1
      AND platform = 'youtube'
      AND status = 'published'
      AND platform_video_id IS NOT NULL
    `, [userId]);

    const youtube = youtubeResult.rows[0];
    const youtubeViews = parseInt(youtube.total_views);
    const youtubeLikes = parseInt(youtube.total_likes);
    const youtubeComments = parseInt(youtube.total_comments);
    const youtubeShares = parseInt(youtube.total_shares);
    const youtubeEngagements = youtubeLikes + youtubeComments + youtubeShares;
    const youtubeEngagementRate = youtubeViews > 0 
      ? ((youtubeEngagements / youtubeViews) * 100).toFixed(2)
      : 0;

    // Instagram stats (placeholder for future)
    const instagram = {
      posts_count: 0,
      total_views: 0,
      total_likes: 0,
      total_comments: 0,
      total_shares: 0,
      avg_views: 0,
      avg_likes: 0
    };

    res.json({
      youtube: {
        postsCount: parseInt(youtube.posts_count),
        totalViews: youtubeViews,
        totalLikes: youtubeLikes,
        totalComments: youtubeComments,
        totalShares: youtubeShares,
        avgViews: parseFloat(youtube.avg_views).toFixed(0),
        avgLikes: parseFloat(youtube.avg_likes).toFixed(0),
        engagementRate: parseFloat(youtubeEngagementRate)
      },
      instagram: {
        postsCount: parseInt(instagram.posts_count),
        totalViews: parseInt(instagram.total_views),
        totalLikes: parseInt(instagram.total_likes),
        totalComments: parseInt(instagram.total_comments),
        totalShares: parseInt(instagram.total_shares),
        avgViews: parseFloat(instagram.avg_views).toFixed(0),
        avgLikes: parseFloat(instagram.avg_likes).toFixed(0),
        engagementRate: 0
      }
    });

  } catch (error) {
    logger.error('Analytics platform error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch platform analytics' });
  }
});

/**
 * POST /api/analytics/sync
 * Manually trigger analytics sync
 */
router.post('/sync', async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info('Manual analytics sync triggered', { userId });

    const result = await syncUserAnalytics(userId);

    if (result.success) {
      res.json({
        success: true,
        message: `Analytics synced successfully. Updated ${result.synced} posts.`,
        synced: result.synced,
        failed: result.failed,
        total: result.total
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to sync analytics'
      });
    }

  } catch (error) {
    logger.error('Manual analytics sync error', { error: error.message, userId: req.user.id });
    res.status(500).json({ 
      success: false,
      message: 'Failed to sync analytics' 
    });
  }
});

/**
 * GET /api/analytics/viral-score-accuracy
 * Calculate viral score prediction accuracy
 */
router.get('/viral-score-accuracy', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get clips with viral scores and actual performance
    const clipsResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.viral_score,
        pp.views_count,
        pp.likes_count,
        pp.comments_count,
        CASE 
          WHEN pp.views_count > 0 
          THEN ((pp.likes_count + pp.comments_count)::float / pp.views_count * 100)
          ELSE 0 
        END as engagement_rate
      FROM clips c
      JOIN published_posts pp ON c.id = pp.clip_id
      WHERE c.user_id = $1
      AND pp.status = 'published'
      AND pp.platform_video_id IS NOT NULL
      AND c.viral_score IS NOT NULL
      AND pp.views_count > 0
      ORDER BY pp.views_count DESC
    `, [userId]);

    const clips = clipsResult.rows;

    if (clips.length === 0) {
      return res.json({
        accuracy: null,
        message: 'Not enough data to calculate accuracy',
        clips: []
      });
    }

    // Calculate actual viral score based on performance
    // Normalize views and engagement to 0-100 scale
    const maxViews = Math.max(...clips.map(c => c.views_count));
    const maxEngagement = Math.max(...clips.map(c => parseFloat(c.engagement_rate)));

    const clipsWithAccuracy = clips.map(clip => {
      // Calculate actual score (weighted: 70% views, 30% engagement)
      const normalizedViews = maxViews > 0 ? (clip.views_count / maxViews) * 100 : 0;
      const normalizedEngagement = maxEngagement > 0 ? (parseFloat(clip.engagement_rate) / maxEngagement) * 100 : 0;
      const actualScore = (normalizedViews * 0.7) + (normalizedEngagement * 0.3);
      
      // Calculate accuracy (how close prediction was)
      const predictedScore = parseFloat(clip.viral_score);
      const difference = Math.abs(predictedScore - actualScore);
      const accuracy = Math.max(0, 100 - difference);

      return {
        id: clip.id,
        title: clip.title,
        predictedScore: predictedScore.toFixed(2),
        actualScore: actualScore.toFixed(2),
        accuracy: accuracy.toFixed(2),
        views: clip.views_count,
        engagementRate: parseFloat(clip.engagement_rate).toFixed(2)
      };
    });

    // Calculate overall accuracy
    const overallAccuracy = clipsWithAccuracy.reduce((sum, clip) => sum + parseFloat(clip.accuracy), 0) / clipsWithAccuracy.length;

    res.json({
      accuracy: overallAccuracy.toFixed(2),
      totalClips: clips.length,
      clips: clipsWithAccuracy,
      interpretation: overallAccuracy >= 80 ? 'Excellent prediction accuracy' :
                     overallAccuracy >= 60 ? 'Good prediction accuracy' :
                     overallAccuracy >= 40 ? 'Fair prediction accuracy' :
                     'Prediction model needs improvement'
    });

  } catch (error) {
    logger.error('Viral score accuracy error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to calculate viral score accuracy' });
  }
});

/**
 * GET /api/analytics/export
 * Export analytics data to CSV
 */
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = 'csv' } = req.query;

    // Get all published posts with analytics
    const postsResult = await pool.query(`
      SELECT 
        c.title,
        c.emotion,
        c.viral_score,
        c.duration,
        pp.platform,
        pp.platform_url,
        pp.views_count,
        pp.likes_count,
        pp.comments_count,
        pp.shares_count,
        pp.avg_view_duration,
        pp.created_at as published_at,
        pp.last_synced_at,
        CASE 
          WHEN pp.views_count > 0 
          THEN ((pp.likes_count + pp.comments_count)::float / pp.views_count * 100)
          ELSE 0 
        END as engagement_rate
      FROM clips c
      JOIN published_posts pp ON c.id = pp.clip_id
      WHERE c.user_id = $1
      AND pp.status = 'published'
      AND pp.platform_video_id IS NOT NULL
      ORDER BY pp.created_at DESC
    `, [userId]);

    const posts = postsResult.rows;

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Title',
        'Platform',
        'Views',
        'Likes',
        'Comments',
        'Engagement Rate (%)',
        'Emotion',
        'Viral Score',
        'Duration (s)',
        'Avg View Duration (s)',
        'Published At',
        'Last Synced',
        'URL'
      ];

      const rows = posts.map(post => [
        `"${post.title.replace(/"/g, '""')}"`,
        post.platform,
        post.views_count,
        post.likes_count,
        post.comments_count,
        parseFloat(post.engagement_rate).toFixed(2),
        post.emotion || 'N/A',
        post.viral_score || 'N/A',
        post.duration || 'N/A',
        post.avg_view_duration || 'N/A',
        new Date(post.published_at).toISOString(),
        post.last_synced_at ? new Date(post.last_synced_at).toISOString() : 'Never',
        post.platform_url || 'N/A'
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="clipforge-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Unsupported export format' });
    }

  } catch (error) {
    logger.error('Analytics export error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to export analytics' });
  }
});

/**
 * GET /api/analytics/ai-insights
 * Get AI-powered insights using Gemini
 */
router.get('/ai-insights', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get analytics data
    const totalsResult = await pool.query(`
      SELECT 
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(SUM(comments_count), 0) as total_comments,
        COUNT(*) as total_posts,
        COALESCE(AVG(views_count), 0) as avg_views
      FROM published_posts
      WHERE user_id = $1
      AND status = 'published'
      AND platform_video_id IS NOT NULL
    `, [userId]);

    const totals = totalsResult.rows[0];

    // Get top clips
    const topClipsResult = await pool.query(`
      SELECT 
        c.title,
        c.emotion,
        c.viral_score,
        pp.views_count as views,
        pp.likes_count as likes,
        pp.comments_count as comments,
        pp.created_at as published_at,
        CASE 
          WHEN pp.views_count > 0 
          THEN ((pp.likes_count + pp.comments_count)::float / pp.views_count * 100)
          ELSE 0 
        END as engagement_rate
      FROM clips c
      JOIN published_posts pp ON c.id = pp.clip_id
      WHERE c.user_id = $1
      AND pp.status = 'published'
      AND pp.platform_video_id IS NOT NULL
      ORDER BY pp.views_count DESC
      LIMIT 5
    `, [userId]);

    const topClips = topClipsResult.rows;

    // Calculate engagement rate
    const totalEngagements = parseInt(totals.total_likes) + parseInt(totals.total_comments);
    const totalViews = parseInt(totals.total_views);
    const engagementRate = totalViews > 0 
      ? ((totalEngagements / totalViews) * 100).toFixed(2)
      : 0;

    // Analyze posting patterns
    const postingPatternResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        EXTRACT(DOW FROM created_at) as day_of_week,
        AVG(views_count) as avg_views
      FROM published_posts
      WHERE user_id = $1
      AND status = 'published'
      AND platform_video_id IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM created_at), EXTRACT(DOW FROM created_at)
      ORDER BY avg_views DESC
      LIMIT 1
    `, [userId]);

    const bestPostingTime = postingPatternResult.rows[0];

    // Prepare data for Gemini
    const analyticsContext = {
      totalViews: parseInt(totals.total_views),
      totalLikes: parseInt(totals.total_likes),
      totalComments: parseInt(totals.total_comments),
      totalPosts: parseInt(totals.total_posts),
      avgViews: parseFloat(totals.avg_views).toFixed(0),
      engagementRate: parseFloat(engagementRate),
      topClips: topClips.map(clip => ({
        title: clip.title,
        emotion: clip.emotion,
        viralScore: clip.viral_score,
        views: clip.views,
        engagementRate: parseFloat(clip.engagement_rate).toFixed(2)
      })),
      bestPostingTime: bestPostingTime ? {
        hour: parseInt(bestPostingTime.hour),
        dayOfWeek: parseInt(bestPostingTime.day_of_week),
        avgViews: parseFloat(bestPostingTime.avg_views).toFixed(0)
      } : null
    };

    // Generate AI insights using Gemini with retry logic
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });

    const prompt = `You are an expert YouTube Shorts analytics consultant. Analyze this performance data and provide actionable insights.

Analytics Data:
- Total Views: ${analyticsContext.totalViews.toLocaleString()}
- Total Likes: ${analyticsContext.totalLikes.toLocaleString()}
- Total Comments: ${analyticsContext.totalComments.toLocaleString()}
- Total Posts: ${analyticsContext.totalPosts}
- Average Views per Post: ${analyticsContext.avgViews}
- Engagement Rate: ${analyticsContext.engagementRate}%

Top Performing Clips:
${topClips.map((clip, i) => `${i + 1}. "${clip.title}" - ${clip.views} views, ${clip.engagement_rate}% engagement, Emotion: ${clip.emotion || 'N/A'}`).join('\n')}

${bestPostingTime ? `Best Posting Time: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestPostingTime.dayOfWeek]} at ${bestPostingTime.hour}:00` : ''}

Provide a JSON response with these insights:
{
  "performanceSummary": "Brief 2-sentence summary of overall performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "contentRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "bestPostingStrategy": "When and how often to post for maximum reach",
  "viralPotential": "Assessment of viral potential and how to improve it"
}

Keep insights specific, actionable, and encouraging. Focus on data-driven recommendations.`;

    // Retry logic for API calls
    let result;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error;
        
        // Check if it's a 503 (service unavailable) error
        if (error.message?.includes('503') || error.message?.includes('high demand')) {
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            logger.info(`Gemini API retry attempt ${attempt}/${maxRetries} after ${delay}ms`, { userId: req.user.id });
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other errors or final retry, throw
        throw error;
      }
    }
    
    if (!result) {
      throw lastError || new Error('Failed to generate AI insights after retries');
    }

    const response = result.response;
    const text = response.text();
    
    // Parse JSON from response
    let insights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;
      insights = JSON.parse(jsonText);
    } catch (parseError) {
      logger.error('Failed to parse AI insights JSON', { error: parseError.message });
      // Fallback to basic insights
      insights = {
        performanceSummary: `You have ${analyticsContext.totalPosts} published clips with ${analyticsContext.totalViews.toLocaleString()} total views and ${analyticsContext.engagementRate}% engagement rate.`,
        strengths: ['Content is being published consistently', 'Audience is engaging with your content'],
        improvements: ['Analyze top performing content patterns', 'Optimize posting schedule'],
        contentRecommendations: ['Create more content similar to your top performers', 'Experiment with different emotions and topics'],
        bestPostingStrategy: 'Post consistently and track which times get the most engagement',
        viralPotential: 'Focus on creating emotionally engaging content with strong hooks'
      };
    }

    res.json({
      insights,
      analyticsContext,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('AI insights error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to generate AI insights' });
  }
});

export default router;
