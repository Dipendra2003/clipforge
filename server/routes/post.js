import express from 'express';
import * as postController from '../controllers/postController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Post clip to YouTube
router.post('/youtube', authenticate, apiLimiter, postController.postToYouTube);

// Get user's published posts
router.get('/my-posts', authenticate, apiLimiter, postController.getPublishedPosts);

// Get posts for a specific clip
router.get('/clip/:clipId', authenticate, apiLimiter, postController.getClipPosts);

// Delete post record (when video deleted from YouTube)
router.delete('/:postId', authenticate, apiLimiter, postController.deletePost);

// Verify if YouTube video still exists
router.get('/:postId/verify', authenticate, apiLimiter, postController.verifyYouTubeVideo);

// Get scheduled posts
router.get('/scheduled', authenticate, apiLimiter, postController.getScheduledPosts);

// Cancel scheduled post
router.post('/:postId/cancel', authenticate, apiLimiter, postController.cancelScheduledPost);

export default router;
