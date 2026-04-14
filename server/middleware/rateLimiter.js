import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// In-memory store (for development)
const rateLimitStore = new Map();

// Custom store implementation
class MemoryStore {
  constructor() {
    this.hits = new Map();
    this.resetTime = new Map();
    
    // Cleanup old entries every hour
    setInterval(() => {
      const now = Date.now();
      for (const [key, time] of this.resetTime.entries()) {
        if (now > time) {
          this.hits.delete(key);
          this.resetTime.delete(key);
        }
      }
    }, 60 * 60 * 1000);
  }

  async increment(key) {
    const now = Date.now();
    const resetTime = this.resetTime.get(key);
    
    if (!resetTime || now > resetTime) {
      this.hits.set(key, 1);
      this.resetTime.set(key, now + 15 * 60 * 1000);
      return { totalHits: 1, resetTime: new Date(now + 15 * 60 * 1000) };
    }
    
    const hits = (this.hits.get(key) || 0) + 1;
    this.hits.set(key, hits);
    return { totalHits: hits, resetTime: new Date(resetTime) };
  }

  async decrement(key) {
    const hits = this.hits.get(key);
    if (hits && hits > 0) {
      this.hits.set(key, hits - 1);
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
    this.resetTime.delete(key);
  }
}

// Create rate limiter with custom options
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new MemoryStore(),
    skipSuccessfulRequests,
    skipFailedRequests,
    handler: (req, res) => {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(429).json({ message });
    }
  });
};

export default createRateLimiter;

// Pre-configured limiters for common use cases
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 for better development experience
  message: 'Too many requests from this IP, please try again later'
});

// More generous limiter for analytics endpoints (they're read-only and frequently accessed)
export const analyticsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very generous for analytics
  message: 'Too many analytics requests, please try again later'
});

// Strict limiter for auth endpoints
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict for security
  message: 'Too many authentication attempts, please try again later'
});
