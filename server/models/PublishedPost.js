import pool from '../config/database.js';

class PublishedPost {
  static async create(postData) {
    const {
      userId,
      clipId,
      platform,
      platformVideoId,
      platformUrl,
      title,
      caption,
      status,
      errorMessage,
      metadata,
      scheduledFor,
      isScheduled
    } = postData;

    const query = `
      INSERT INTO published_posts (
        user_id, clip_id, platform, platform_video_id, platform_url,
        title, caption, status, error_message, metadata, scheduled_for, is_scheduled
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      userId,
      clipId,
      platform,
      platformVideoId || null,
      platformUrl || null,
      title || null,
      caption || null,
      status || 'pending',
      errorMessage || null,
      metadata ? JSON.stringify(metadata) : null,
      scheduledFor || null,
      isScheduled || false
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM published_posts WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByClipId(clipId) {
    const query = `
      SELECT * FROM published_posts 
      WHERE clip_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [clipId]);
    return result.rows;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT pp.*, c.title as clip_title 
      FROM published_posts pp
      JOIN clips c ON pp.clip_id = c.id
      WHERE pp.user_id = $1 
      ORDER BY pp.created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async updateStatus(id, status, errorMessage = null, platformVideoId = null, platformUrl = null) {
    const query = `
      UPDATE published_posts 
      SET status = $1, error_message = $2, platform_video_id = $3, platform_url = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [status, errorMessage, platformVideoId, platformUrl, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM published_posts WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) FROM published_posts WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async findScheduledPosts() {
    const query = `
      SELECT pp.*, c.file_path, c.transcript
      FROM published_posts pp
      JOIN clips c ON pp.clip_id = c.id
      WHERE pp.status = 'scheduled' 
        AND pp.is_scheduled = true 
        AND pp.scheduled_for <= (NOW() AT TIME ZONE 'Asia/Kolkata')::timestamp
      ORDER BY pp.scheduled_for ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async findScheduledByUserId(userId) {
    const query = `
      SELECT pp.*, c.title as clip_title, c.file_path
      FROM published_posts pp
      JOIN clips c ON pp.clip_id = c.id
      WHERE pp.user_id = $1 
        AND pp.status = 'scheduled'
        AND pp.is_scheduled = true
      ORDER BY pp.scheduled_for ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async cancelScheduled(id) {
    const query = `
      UPDATE published_posts 
      SET status = 'cancelled', is_scheduled = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default PublishedPost;
