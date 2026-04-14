import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authMiddleware.js';
import Video from '../models/Video.js';
import Clip from '../models/Clip.js';
import axios from 'axios';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();
const fsPromises = fs.promises;

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../downloads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|mov|avi|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Save processed video and clips from Flask
router.post('/save-processed', async (req, res) => {
  try {
    const { videoId, userId, sourceUrl, videoInfo, clips, subtitleUrl, thumbnailUrl, thumbnailCloudUrl, videoCloudUrl, videoCloudinaryPublicId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    console.log('💾 Saving video with cloud URLs:', {
      thumbnailUrl,
      thumbnailCloudUrl,
      videoCloudUrl,
      sourceUrl
    });

    // Extract title from videoInfo or use generic fallback
    const videoTitle = videoInfo?.title || videoInfo?.name || `Video ${videoId}`;

    // Determine source type based on URL
    let sourceType = 'upload';
    if (sourceUrl) {
      if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
        sourceType = 'youtube';
      } else if (sourceUrl.includes('facebook.com') || sourceUrl.includes('fb.watch')) {
        sourceType = 'facebook';
      } else if (sourceUrl.includes('instagram.com')) {
        sourceType = 'instagram';
      } else if (sourceUrl.includes('tiktok.com')) {
        sourceType = 'tiktok';
      } else if (sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com')) {
        sourceType = 'twitter';
      } else {
        sourceType = 'url';
      }
    }

    // Save video to database
    const video = await Video.create({
      userId: userId,
      title: videoTitle,
      sourceType: sourceType,
      sourceUrl: sourceUrl || null,
      filePath: `downloads/${videoId}.mp4`,
      thumbnailPath: thumbnailUrl ? `downloads/${videoId}_thumb.jpg` : null,
      thumbnailCloudUrl: thumbnailCloudUrl || null,
      cloudUrl: videoCloudUrl || null,  // Save original video cloud URL
      cloudinaryPublicId: videoCloudinaryPublicId || null,  // Save Cloudinary public ID
      duration: videoInfo.duration || 0,
      fileSize: videoInfo.file_size || 0,
      hasSubtitles: !!subtitleUrl,
      subtitlePath: subtitleUrl ? `downloads/${videoId}.vtt` : null,
      metadata: videoInfo
    });

    // Update video status to completed
    await Video.updateStatus(video.id, 'completed');

    // Save clips to database
    const savedClips = [];
    for (const clip of clips) {
      // Ensure we save relative path, not full URL
      let clipFilePath = clip.filePath;
      
      // If filePath is a full URL, extract just the filename
      if (clipFilePath && (clipFilePath.startsWith('http://') || clipFilePath.startsWith('https://'))) {
        const urlParts = clipFilePath.split('/');
        const filename = urlParts[urlParts.length - 1];
        clipFilePath = `downloads/${filename}`;
        console.log(`⚠️  Converted URL to path: ${clip.filePath} → ${clipFilePath}`);
      }
      
      // If clipUrl is provided but filePath is not, extract from clipUrl
      if (!clipFilePath && clip.clipUrl) {
        const urlParts = clip.clipUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        clipFilePath = `downloads/${filename}`;
        console.log(`📝 Extracted from clipUrl: ${clip.clipUrl} → ${clipFilePath}`);
      }
      
      // Ensure path starts with downloads/ (handle both forward and backslash)
      if (clipFilePath && !clipFilePath.startsWith('downloads/') && !clipFilePath.startsWith('downloads\\')) {
        clipFilePath = `downloads/${clipFilePath}`;
        console.log(`📁 Added downloads/ prefix: ${clipFilePath}`);
      }
      
      // Normalize path separators to forward slashes
      if (clipFilePath) {
        clipFilePath = clipFilePath.replace(/\\/g, '/');
      }
      
      console.log(`💾 Saving clip to database:`, {
        title: clip.title,
        filePath: clipFilePath,
        cloudUrl: clip.cloudUrl || clip.cloud_url || 'NOT SET',
        viralScore: clip.viralScore,
        viralScoreType: typeof clip.viralScore,
        startTime: clip.startTime,
        endTime: clip.endTime
      });
      
      const savedClip = await Clip.create({
        videoId: video.id,
        userId: userId,
        title: clip.title,
        startTime: clip.startTime,
        endTime: clip.endTime,
        duration: clip.duration,
        filePath: clipFilePath,
        cloudUrl: clip.cloudUrl || clip.cloud_url || null,
        cloudinaryPublicId: clip.cloudinaryPublicId || clip.cloudinary_public_id || null,
        emotion: clip.emotion,
        viralScore: clip.viralScore || 75,  // Default to 75% if not provided
        metadata: { reason: clip.reason }
      });
      savedClips.push(savedClip);
    }

    res.json({
      success: true,
      video: video,
      clips: savedClips
    });

  } catch (error) {
    console.error('Save processed video error:', error);
    res.status(500).json({ error: 'Failed to save processed video' });
  }
});

// Upload video file
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { title, description } = req.body;

    // Create video record in database
    const video = await Video.create({
      userId: req.user.id,
      title: title || req.file.originalname,
      description: description || null,
      sourceType: 'upload',
      filePath: req.file.path,
      fileSize: req.file.size,
      status: 'pending'
    });

    res.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        fileSize: video.file_size
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Process video with AI
router.post('/process/:videoId', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;

    // Get video from database
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (video.status === 'processing') {
      return res.status(400).json({ error: 'Video is already being processed' });
    }

    // Update status to processing
    await Video.updateStatus(videoId, 'processing');

    // Call Python Flask API to process video
    const flaskUrl = 'http://localhost:5001/process';
    const videoFilename = path.basename(video.file_path);
    const videoIdFromPath = videoFilename.split('.')[0];

    try {
      const response = await axios.post(flaskUrl, {
        videoId: videoIdFromPath
      }, {
        timeout: 600000 // 10 minutes timeout
      });

      const result = response.data;

      // Update video with processing results
      await Video.update(videoId, {
        duration: result.videoInfo?.duration || 0,
        has_subtitles: !!result.subtitleUrl,
        subtitle_path: result.subtitleUrl ? `${videoIdFromPath}.vtt` : null,
        thumbnail_path: result.thumbnailUrl ? `${videoIdFromPath}_thumb.jpg` : null,
        status: 'completed'
      });

      // Create clip records in database
      const clips = [];
      for (const clipData of result.clips || []) {
        const clip = await Clip.create({
          videoId: videoId,
          userId: req.user.id,
          title: clipData.title,
          startTime: Math.floor(clipData.startTime),
          endTime: Math.floor(clipData.endTime),
          duration: Math.floor(clipData.duration),
          filePath: clipData.clipUrl,
          emotion: clipData.emotion,
          viralScore: clipData.viralScore,
          metadata: {
            reason: clipData.reason
          }
        });
        clips.push(clip);
      }

      res.json({
        success: true,
        video: await Video.findById(videoId),
        clips: clips
      });

    } catch (flaskError) {
      console.error('Flask processing error:', flaskError.message);
      await Video.updateStatus(videoId, 'failed', flaskError.message);
      throw flaskError;
    }

  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
});

// Get user's videos
router.get('/my-videos', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const videos = await Video.findByUserId(req.user.id, parseInt(limit), parseInt(offset));
    const total = await Video.countByUserId(req.user.id);

    // Enhance videos with metadata titles if they have generic titles
    const enhancedVideos = videos.map(video => {
      // Check if video has a generic title pattern (starts with "Video " followed by UUID)
      if (video.title && video.title.startsWith('Video ') && video.title.length > 40) {
        // Try to get title from metadata
        if (video.metadata && video.metadata.title) {
          return {
            ...video,
            title: video.metadata.title,
            originalTitle: video.title // Keep original for reference
          };
        }
      }
      return video;
    });

    res.json({
      videos: enhancedVideos,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get video by ID
router.get('/:videoId', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get clips for this video
    const clips = await Clip.findByVideoId(video.id);

    // Transform clips to use cloud URL if available and convert viral_score to number
    const transformedClips = clips.map(clip => ({
      ...clip,
      viral_score: clip.viral_score ? Number(clip.viral_score) : null,
      clipUrl: clip.cloud_url || `http://127.0.0.1:5001/video/clips/${clip.file_path.split('/').pop()}`
    }));

    // Enhance video with metadata title if it has a generic title
    let enhancedVideo = video;
    if (video.title && video.title.startsWith('Video ') && video.title.length > 40) {
      if (video.metadata && video.metadata.title) {
        enhancedVideo = {
          ...video,
          title: video.metadata.title,
          originalTitle: video.title
        };
      }
    }

    res.json({
      video: enhancedVideo,
      clips: transformedClips
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Update video
router.patch('/:videoId', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { title, description } = req.body;
    const updates = {};

    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;

    const updatedVideo = await Video.update(video.id, updates);

    res.json({ success: true, video: updatedVideo });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// Delete video
router.delete('/:videoId', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (video.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete video file if it exists locally
    try {
      if (video.file_path && !video.file_path.startsWith('http')) {
        // Check if file exists before trying to delete
        try {
          await fsPromises.access(video.file_path);
          await fsPromises.unlink(video.file_path);
          console.log('Video file deleted:', video.file_path);
        } catch (err) {
          if (err.code === 'ENOENT') {
            console.log('Video file already deleted or not found:', video.file_path);
          } else {
            console.error('Error deleting video file:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error checking video file:', err);
    }

    // Delete from database (clips will be deleted via CASCADE)
    await Video.delete(video.id);

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

export default router;
