import cron from 'node-cron';
import { syncAllUsersAnalytics } from './youtubeAnalytics.js';
import { syncAllUsersInstagramAnalytics } from './instagramAnalytics.js';
import logger from '../utils/logger.js';

/**
 * Initialize analytics sync scheduler
 * Runs every 6 hours to fetch latest YouTube and Instagram analytics
 */
export function initAnalyticsScheduler() {
  // Run every 6 hours
  // Cron format: minute hour day month weekday
  // '0 */6 * * *' = every 6 hours at minute 0
  cron.schedule('0 */6 * * *', async () => {
    logger.info('🔄 Starting scheduled analytics sync...');
    
    try {
      // Sync YouTube analytics
      const youtubeResult = await syncAllUsersAnalytics();
      
      if (youtubeResult.success) {
        logger.info('✅ YouTube analytics sync completed', {
          users: youtubeResult.users,
          synced: youtubeResult.synced,
          failed: youtubeResult.failed
        });
      } else {
        logger.error('❌ YouTube analytics sync failed', {
          message: youtubeResult.message
        });
      }

      // Sync Instagram analytics
      const instagramResult = await syncAllUsersInstagramAnalytics();
      
      if (instagramResult.success) {
        logger.info('✅ Instagram analytics sync completed', {
          users: instagramResult.users,
          synced: instagramResult.synced,
          failed: instagramResult.failed
        });
      } else {
        logger.error('❌ Instagram analytics sync failed', {
          message: instagramResult.message
        });
      }

      // Log combined results
      logger.info('✅ All platforms analytics sync completed', {
        youtube: {
          users: youtubeResult.users || 0,
          synced: youtubeResult.synced || 0,
          failed: youtubeResult.failed || 0
        },
        instagram: {
          users: instagramResult.users || 0,
          synced: instagramResult.synced || 0,
          failed: instagramResult.failed || 0
        }
      });
    } catch (error) {
      logger.error('❌ Scheduled analytics sync error', {
        error: error.message,
        stack: error.stack
      });
    }
  });

  logger.info('✅ Analytics scheduler initialized (runs every 6 hours)');
}

/**
 * Run analytics sync immediately (for testing)
 */
export async function runAnalyticsSyncNow() {
  logger.info('🔄 Running analytics sync manually...');
  
  try {
    // Sync YouTube
    const youtubeResult = await syncAllUsersAnalytics();
    
    if (youtubeResult.success) {
      logger.info('✅ Manual YouTube analytics sync completed', {
        users: youtubeResult.users,
        synced: youtubeResult.synced,
        failed: youtubeResult.failed
      });
    } else {
      logger.error('❌ Manual YouTube analytics sync failed', {
        message: youtubeResult.message
      });
    }

    // Sync Instagram
    const instagramResult = await syncAllUsersInstagramAnalytics();
    
    if (instagramResult.success) {
      logger.info('✅ Manual Instagram analytics sync completed', {
        users: instagramResult.users,
        synced: instagramResult.synced,
        failed: instagramResult.failed
      });
    } else {
      logger.error('❌ Manual Instagram analytics sync failed', {
        message: instagramResult.message
      });
    }

    return {
      success: true,
      youtube: youtubeResult,
      instagram: instagramResult
    };
  } catch (error) {
    logger.error('❌ Manual analytics sync error', {
      error: error.message
    });
    return { success: false, message: error.message };
  }
}

export default {
  initAnalyticsScheduler,
  runAnalyticsSyncNow
};
