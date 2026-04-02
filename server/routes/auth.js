import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateSignup, validateLogin, validateResetPassword, validateProfileUpdate, validatePasswordChange, validateEmailOnly, validateOTPVerification } from '../middleware/validator.js';
import createRateLimiter from '../middleware/rateLimiter.js';
import { getCsrfToken } from '../middleware/csrf.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // 20 for dev, 5 for production
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: false
});

const strictAuthLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 15, // 15 for dev, 3 for production
  message: 'Too many attempts, please try again after an hour'
});

const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000 // High limit for general endpoints
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
router.post('/forgot-password', strictAuthLimiter, validateEmailOnly, authController.forgotPassword);
router.post('/verify-otp', strictAuthLimiter, validateOTPVerification, authController.verifyOTP);
router.post('/reset-password', strictAuthLimiter, validateResetPassword, authController.resetPassword);

// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);
router.put('/password', authenticate, validatePasswordChange, authController.changePassword);

export default router;
