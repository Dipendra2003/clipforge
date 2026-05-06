import pool from '../config/database.js';
import {
  sendProcessingCompleteEmail,
  sendScheduledPostReminderEmail,
  sendMarketingEmail
} from '../utils/email.js';

/**
 * Check if user has notification preference enabled
 */
const hasPreferenceEnabled = async (userId, preferenceType) => {
  try {
    const result = await pool.query(
      `SELECT email_notifications, ${preferenceType}
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // No preferences set, use defaults
      return preferenceType !== 'marketing_emails'; // All true except marketing
    }

    const prefs = result.rows[0];
    // Check both master toggle and specific preference
    return prefs.email_notifications && prefs[preferenceType];
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return false; // Fail safe - don't send if error
  }
};

/**
 * Send video processing complete notification
 */
export const notifyProcessingComplete = async (userId, videoTitle, clipCount) => {
  try {
    // Check if user wants this notification
    const shouldSend = await hasPreferenceEnabled(userId, 'processing_complete');
    if (!shouldSend) {
      console.log(`⏭️  Skipping processing complete notification for user ${userId} (disabled in preferences)`);
      return { sent: false, reason: 'disabled' };
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found:', userId);
      return { sent: false, reason: 'user_not_found' };
    }

    const { name, email } = userResult.rows[0];

    // Send email
    await sendProcessingCompleteEmail(email, name, videoTitle, clipCount);

    console.log(`✓ Processing complete notification sent to ${email}`);
    return { sent: true, email };
  } catch (error) {
    console.error('Error sending processing complete notification:', error);
    return { sent: false, reason: 'error', error: error.message };
  }
};

/**
 * Send scheduled post reminder notification
 */
export const notifyScheduledPosts = async (userId, posts) => {
  try {
    // Check if user wants this notification
    const shouldSend = await hasPreferenceEnabled(userId, 'scheduled_posts');
    if (!shouldSend) {
      console.log(`⏭️  Skipping scheduled posts notification for user ${userId} (disabled in preferences)`);
      return { sent: false, reason: 'disabled' };
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found:', userId);
      return { sent: false, reason: 'user_not_found' };
    }

    const { name, email } = userResult.rows[0];

    // Send email
    await sendScheduledPostReminderEmail(email, name, posts);

    console.log(`✓ Scheduled posts reminder sent to ${email}`);
    return { sent: true, email };
  } catch (error) {
    console.error('Error sending scheduled posts notification:', error);
    return { sent: false, reason: 'error', error: error.message };
  }
};

/**
 * Send marketing/tips email
 */
export const sendMarketingNotification = async (userId, subject, content) => {
  try {
    // Check if user wants marketing emails
    const shouldSend = await hasPreferenceEnabled(userId, 'marketing_emails');
    if (!shouldSend) {
      console.log(`⏭️  Skipping marketing email for user ${userId} (disabled in preferences)`);
      return { sent: false, reason: 'disabled' };
    }

    // Get user details
    const userResult = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      console.error('User not found:', userId);
      return { sent: false, reason: 'user_not_found' };
    }

    const { name, email } = userResult.rows[0];

    // Send email
    await sendMarketingEmail(email, name, subject, content);

    console.log(`✓ Marketing email sent to ${email}`);
    return { sent: true, email };
  } catch (error) {
    console.error('Error sending marketing email:', error);
    return { sent: false, reason: 'error', error: error.message };
  }
};

/**
 * Batch send scheduled post reminders (for cron job)
 * Sends reminders for posts scheduled in the next 24 hours
 */
export const sendScheduledPostReminders = async () => {
  try {
    console.log('🔔 Running scheduled post reminder job...');

    // Get all posts scheduled in the next 24 hours
    const result = await pool.query(`
      SELECT 
        pp.user_id,
        pp.title,
        pp.platform,
        pp.scheduled_for,
        u.name as user_name,
        u.email as user_email
      FROM published_posts pp
      JOIN users u ON pp.user_id = u.id
      WHERE pp.status = 'scheduled'
        AND pp.scheduled_for > NOW()
        AND pp.scheduled_for <= NOW() + INTERVAL '24 hours'
      ORDER BY pp.user_id, pp.scheduled_for
    `);

    if (result.rows.length === 0) {
      console.log('No scheduled posts in the next 24 hours');
      return { sent: 0, total: 0 };
    }

    // Group posts by user
    const postsByUser = {};
    result.rows.forEach(row => {
      if (!postsByUser[row.user_id]) {
        postsByUser[row.user_id] = {
          userName: row.user_name,
          email: row.user_email,
          posts: []
        };
      }
      postsByUser[row.user_id].posts.push({
        title: row.title,
        platform: row.platform,
        scheduled_for: row.scheduled_for
      });
    });

    // Send reminders to each user
    let sentCount = 0;
    const totalUsers = Object.keys(postsByUser).length;

    for (const [userId, userData] of Object.entries(postsByUser)) {
      const result = await notifyScheduledPosts(userId, userData.posts);
      if (result.sent) {
        sentCount++;
      }
    }

    console.log(`✓ Sent ${sentCount}/${totalUsers} scheduled post reminders`);
    return { sent: sentCount, total: totalUsers };
  } catch (error) {
    console.error('Error in scheduled post reminder job:', error);
    return { sent: 0, total: 0, error: error.message };
  }
};

export default {
  notifyProcessingComplete,
  notifyScheduledPosts,
  sendMarketingNotification,
  sendScheduledPostReminders
};
