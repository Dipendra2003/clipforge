import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import videoRoutes from './routes/video.js';
import clipRoutes from './routes/clip.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/user.js';
import platformRoutes from './routes/platform.js';
import postRoutes from './routes/post.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import contactRoutes from './routes/contact.js';
import notificationRoutes from './routes/notification.js';
import { setupCleanupJobs } from './utils/cleanup.js';
import { initScheduler } from './services/scheduler.js';
import { initAnalyticsScheduler } from './services/analyticsScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
// Helmet - Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
}));

// Body parser with size limits
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/post', postRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Setup cleanup jobs for expired tokens and sessions
  setupCleanupJobs();
  console.log('✓ Cleanup jobs scheduled');
  
  // Initialize post scheduler for YouTube Shorts
  initScheduler();
  console.log('✓ Post scheduler initialized');
  
  // Initialize analytics scheduler for YouTube analytics sync
  initAnalyticsScheduler();
  console.log('✓ Analytics scheduler initialized');
});

export default app;
