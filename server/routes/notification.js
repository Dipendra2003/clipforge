import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.put('/preferences', updateNotificationPreferences);

// Reset notification preferences to defaults
router.post('/preferences/reset', resetNotificationPreferences);

export default router;
