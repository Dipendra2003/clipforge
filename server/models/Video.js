import pool from '../config/database.js';

class Video {
  static async create(videoData) {
    const {
      userId,
      title,
      description,
      sourceType,
      sourceUrl,
      filePath,
      thumbnailPath,
      duration,
      fileSize,
      hasSubtitles,
      subtitlePath,
      metadata
    } = videoData;

    const query = `
      INSERT INTO videos (
        user_id, title, description, source_type, source_url,
        file_path, thumbnail_path, duration, file_size,
        has_subtitles, subtitle_path, metadata, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      userId,
      title,
      description || null,
      sourceType,
      sourceUrl || null,
      filePath,
      thumbnailPath || null,
      duration || 0,
      fileSize || 0,
      hasSubtitles || false,
      subtitlePath || null,
      metadata ? JSON.stringify(metadata) : null,
      'pending'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM videos WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM videos 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async updateStatus(id, status, errorMessage = null) {
    const query = `
      UPDATE videos 
      SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [status, errorMessage, id]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const allowedFields = [
      'title', 'description', 'thumbnail_path', 'duration',
      'has_subtitles', 'subtitle_path', 'metadata', 'status'
    ];

    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        setClause.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (setClause.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE videos 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM videos WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) FROM videos WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }
}

export default Video;
