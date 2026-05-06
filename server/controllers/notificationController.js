import pool from '../config/database.js';

/**
 * Get user's notification preferences
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        email_notifications,
        processing_complete,
        scheduled_posts,
        marketing_emails,
        updated_at
      FROM notification_preferences
      WHERE user_id = $1`,
      [userId]
    );

    // If no preferences exist, create default ones
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, processing_complete, scheduled_posts, marketing_emails)
        VALUES ($1, TRUE, TRUE, TRUE, FALSE)
        RETURNING email_notifications, processing_complete, scheduled_posts, marketing_emails, updated_at`,
        [userId]
      );

      return res.json({
        success: true,
        preferences: insertResult.rows[0]
      });
    }

    res.json({
      success: true,
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
};

/**
 * Update user's notification preferences
 */
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_notifications,
      processing_complete,
      scheduled_posts,
      marketing_emails
    } = req.body;

    // Validate input
    const validFields = ['email_notifications', 'processing_complete', 'scheduled_posts', 'marketing_emails'];
    const updates = {};
    
    for (const field of validFields) {
      if (req.body.hasOwnProperty(field)) {
        if (typeof req.body[field] !== 'boolean') {
          return res.status(400).json({
            success: false,
            message: `${field} must be a boolean value`
          });
        }
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Build dynamic UPDATE query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [userId, ...Object.values(updates)];

    const result = await pool.query(
      `UPDATE notification_preferences
      SET ${setClause}
      WHERE user_id = $1
      RETURNING email_notifications, processing_complete, scheduled_posts, marketing_emails, updated_at`,
      values
    );

    // If no row was updated, create a new one
    if (result.rows.length === 0) {
      const insertResult = await pool.query(
        `INSERT INTO notification_preferences (
          user_id, 
          email_notifications, 
          processing_complete, 
          scheduled_posts, 
          marketing_emails
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING email_notifications, processing_complete, scheduled_posts, marketing_emails, updated_at`,
        [
          userId,
          updates.email_notifications !== undefined ? updates.email_notifications : true,
          updates.processing_complete !== undefined ? updates.processing_complete : true,
          updates.scheduled_posts !== undefined ? updates.scheduled_posts : true,
          updates.marketing_emails !== undefined ? updates.marketing_emails : false
        ]
      );

      return res.json({
        success: true,
        message: 'Notification preferences created',
        preferences: insertResult.rows[0]
      });
    }

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

/**
 * Reset notification preferences to defaults
 */
export const resetNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE notification_preferences
      SET 
        email_notifications = TRUE,
        processing_complete = TRUE,
        scheduled_posts = TRUE,
        marketing_emails = FALSE
      WHERE user_id = $1
      RETURNING email_notifications, processing_complete, scheduled_posts, marketing_emails, updated_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences if they don't exist
      const insertResult = await pool.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, processing_complete, scheduled_posts, marketing_emails)
        VALUES ($1, TRUE, TRUE, TRUE, FALSE)
        RETURNING email_notifications, processing_complete, scheduled_posts, marketing_emails, updated_at`,
        [userId]
      );

      return res.json({
        success: true,
        message: 'Notification preferences reset to defaults',
        preferences: insertResult.rows[0]
      });
    }

    res.json({
      success: true,
      message: 'Notification preferences reset to defaults',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Reset notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset notification preferences'
    });
  }
};
