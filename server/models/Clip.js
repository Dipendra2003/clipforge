import pool from '../config/database.js';

class Clip {
  static async create(clipData) {
    const {
      videoId,
      userId,
      title,
      startTime,
      endTime,
      duration,
      filePath,
      thumbnailPath,
      emotion,
      viralScore,
      transcript,
      metadata
    } = clipData;

    const query = `
      INSERT INTO clips (
        video_id, user_id, title, start_time, end_time, duration,
        file_path, thumbnail_path, emotion, viral_score, transcript,
        metadata, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      videoId,
      userId,
      title,
      startTime,
      endTime,
      duration,
      filePath,
      thumbnailPath || null,
      emotion || null,
      viralScore || null,
      transcript || null,
      metadata ? JSON.stringify(metadata) : null,
      'completed'
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM clips WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByVideoId(videoId) {
    const query = `
      SELECT * FROM clips 
      WHERE video_id = $1 
      ORDER BY viral_score DESC, created_at DESC
    `;
    const result = await pool.query(query, [videoId]);
    return result.rows;
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT c.*, v.title as video_title 
      FROM clips c
      JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1 
      ORDER BY c.created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async findTopByViralScore(userId, limit = 10) {
    const query = `
      SELECT c.*, v.title as video_title 
      FROM clips c
      JOIN videos v ON c.video_id = v.id
      WHERE c.user_id = $1 
      ORDER BY c.viral_score DESC, c.created_at DESC 
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  static async update(id, updates) {
    const allowedFields = [
      'title', 'thumbnail_path', 'emotion', 'viral_score',
      'transcript', 'metadata', 'status'
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
      UPDATE clips 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM clips WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async countByUserId(userId) {
    const query = 'SELECT COUNT(*) FROM clips WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  static async countByVideoId(videoId) {
    const query = 'SELECT COUNT(*) FROM clips WHERE video_id = $1';
    const result = await pool.query(query, [videoId]);
    return parseInt(result.rows[0].count);
  }
}

export default Clip;
