import express from 'express';
import * as platformController from '../controllers/platformController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import authenticateWithQuery from '../middleware/authenticateWithQuery.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================
// YOUTUBE OAUTH ROUTES
// ============================================

// Initiate YouTube OAuth flow (accepts token from query or header)
router.get('/youtube', authenticateWithQuery, apiLimiter, platformController.initiateYouTubeAuth);

// YouTube OAuth callback (NO authentication - user coming from Google)
router.get('/youtube/callback', platformController.youtubeCallback);

// ============================================
// PLATFORM CONNECTION MANAGEMENT
// ============================================

// Get all connected platforms for user (requires authentication)
router.get('/connections', authenticate, apiLimiter, platformController.getPlatformConnections);

// Disconnect a platform (requires authentication)
router.delete('/connections/:platform', authenticate, apiLimiter, platformController.disconnectPlatform);

export default router;
