import cron from 'node-cron';
import { syncAllUsersAnalytics } from './youtubeAnalytics.js';
import logger from '../utils/logger.js';

/**
 * Initialize analytics sync scheduler
 * Runs every 10 minutes to fetch latest YouTube analytics
 */
export function initAnalyticsScheduler() {
  // Run every 10 minutes
  // Cron format: minute hour day month weekday
  // '*/10 * * * *' = every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    logger.info('🔄 Starting scheduled analytics sync...');
    
    try {
      const result = await syncAllUsersAnalytics();
      
      if (result.success) {
        logger.info('✅ Scheduled analytics sync completed', {
          users: result.users,
          synced: result.synced,
          failed: result.failed
        });
      } else {
        logger.error('❌ Scheduled analytics sync failed', {
          message: result.message
        });
      }
    } catch (error) {
      logger.error('❌ Scheduled analytics sync error', {
        error: error.message
      });
    }
  });

  logger.info('✅ Analytics scheduler initialized (runs every 10 minutes)');
}

/**
 * Run analytics sync immediately (for testing)
 */
export async function runAnalyticsSyncNow() {
  logger.info('🔄 Running analytics sync manually...');
  
  try {
    const result = await syncAllUsersAnalytics();
    
    if (result.success) {
      logger.info('✅ Manual analytics sync completed', {
        users: result.users,
        synced: result.synced,
        failed: result.failed
      });
      return result;
    } else {
      logger.error('❌ Manual analytics sync failed', {
        message: result.message
      });
      return result;
    }
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
