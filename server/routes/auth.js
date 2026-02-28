import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateSignup, validateLogin, validateResetPassword } from '../middleware/validator.js';
import createRateLimiter from '../middleware/rateLimiter.js';
import { getCsrfToken } from '../middleware/csrf.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: false
});

const strictAuthLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many attempts, please try again after an hour'
});

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// CSRF token endpoint
router.get('/csrf-token', getCsrfToken);

// Public routes
router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/refresh-token', generalLimiter, authController.refreshToken);
router.post('/verify-email', generalLimiter, authController.verifyEmail);
router.post('/resend-verification', strictAuthLimiter, authController.resendVerification);
router.post('/forgot-password', strictAuthLimiter, authController.forgotPassword);
router.post('/reset-password', strictAuthLimiter, validateResetPassword, authController.resetPassword);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
