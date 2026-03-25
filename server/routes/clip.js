import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import Clip from '../models/Clip.js';
import Video from '../models/Video.js';

const router = express.Router();

// PUBLIC: Get clip by ID for sharing (no auth required)
router.get('/public/:clipId', async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    // Get video info for additional context
    const video = await Video.findById(clip.video_id);

    // Transform clip to use cloud URL if available and convert viral_score to number
    const transformedClip = {
      id: clip.id,
      title: clip.title,
      duration: clip.duration,
      start_time: clip.start_time,
      end_time: clip.end_time,
      emotion: clip.emotion,
      viral_score: clip.viral_score ? Number(clip.viral_score) : null,
      created_at: clip.created_at,
      clipUrl: clip.cloud_url || `http://127.0.0.1:5001/video/clips/${clip.file_path.split('/').pop()}`,
      videoTitle: video?.title || 'Untitled Video'
    };

    res.json({ clip: transformedClip });
  } catch (error) {
    console.error('Get public clip error:', error);
    res.status(500).json({ error: 'Failed to fetch clip' });
  }
});

// Get user's clips
router.get('/my-clips', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const clips = await Clip.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
    const total = await Clip.countByUserId(req.user.id);

    // Transform clips to use cloud URL if available and convert viral_score to number
    const transformedClips = clips.map(clip => ({
      ...clip,
      viral_score: clip.viral_score ? Number(clip.viral_score) : null,
      clipUrl: clip.cloud_url || `http://127.0.0.1:5001/video/clips/${clip.file_path.split('/').pop()}`
    }));

    res.json({
      clips: transformedClips,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get clips error:', error);
    res.status(500).json({ error: 'Failed to fetch clips' });
  }
});

// Get top viral clips
router.get('/top-viral', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const clips = await Clip.findTopByViralScore(req.user.id, parseInt(limit));

    // Transform clips to use cloud URL if available and convert viral_score to number
    const transformedClips = clips.map(clip => ({
      ...clip,
      viral_score: clip.viral_score ? Number(clip.viral_score) : null,
      clipUrl: clip.cloud_url || `http://127.0.0.1:5001/video/clips/${clip.file_path.split('/').pop()}`
    }));

    res.json({ clips: transformedClips });
  } catch (error) {
    console.error('Get top clips error:', error);
    res.status(500).json({ error: 'Failed to fetch top clips' });
  }
});

// Get clip by ID
router.get('/:clipId', authenticate, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    if (clip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Transform clip to use cloud URL if available and convert viral_score to number
    const transformedClip = {
      ...clip,
      viral_score: clip.viral_score ? Number(clip.viral_score) : null,
      clipUrl: clip.cloud_url || `http://127.0.0.1:5001/video/clips/${clip.file_path.split('/').pop()}`
    };

    res.json({ clip: transformedClip });
  } catch (error) {
    console.error('Get clip error:', error);
    res.status(500).json({ error: 'Failed to fetch clip' });
  }
});

// Update clip
router.patch('/:clipId', authenticate, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    if (clip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, emotion } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (emotion) updates.emotion = emotion;

    const updatedClip = await Clip.update(clip.id, updates);

    res.json({ success: true, clip: updatedClip });
  } catch (error) {
    console.error('Update clip error:', error);
    res.status(500).json({ error: 'Failed to update clip' });
  }
});

// Delete clip
router.delete('/:clipId', authenticate, async (req, res) => {
  try {
    const clip = await Clip.findById(req.params.clipId);

    if (!clip) {
      return res.status(404).json({ error: 'Clip not found' });
    }

    if (clip.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Clip.delete(clip.id);

    res.json({ success: true, message: 'Clip deleted successfully' });
  } catch (error) {
    console.error('Delete clip error:', error);
    res.status(500).json({ error: 'Failed to delete clip' });
  }
});

export default router;
