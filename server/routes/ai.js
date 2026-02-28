import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Generate AI caption for clip
router.post('/generate-caption', authenticate, apiLimiter, aiController.generateCaption);

export default router;
