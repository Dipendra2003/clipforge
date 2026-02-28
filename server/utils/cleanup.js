import Token from '../models/Token.js';
import Session from '../models/Session.js';

// Cleanup expired tokens and sessions
const cleanupExpiredData = async () => {
  try {
    await Token.cleanupExpired();
    await Session.cleanupExpired();
    console.log('✓ Cleaned up expired tokens and sessions');
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

// Setup cleanup jobs
const setupCleanupJobs = () => {
  // Run cleanup every hour
  setInterval(cleanupExpiredData, 60 * 60 * 1000);
  
  // Run initial cleanup after 10 seconds (give DB time to connect)
  setTimeout(cleanupExpiredData, 10000);
};

export { setupCleanupJobs, cleanupExpiredData };
