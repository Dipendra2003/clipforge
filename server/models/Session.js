import pool from '../config/database.js';

class Session {
  // Create a new session
  static async create(userId, refreshToken, device = 'unknown') {
    const query = `
      INSERT INTO sessions (user_id, refresh_token, device, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, refreshToken, device]);
    return result.rows[0];
  }

  // Find session by refresh token
  static async findByToken(refreshToken) {
    const query = 'SELECT * FROM sessions WHERE refresh_token = $1';
    const result = await pool.query(query, [refreshToken]);
    return result.rows[0];
  }

  // Find all sessions for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Delete a specific session
  static async delete(refreshToken) {
    const query = 'DELETE FROM sessions WHERE refresh_token = $1';
    await pool.query(query, [refreshToken]);
  }

  // Delete all sessions for a user
  static async deleteAllByUserId(userId) {
    const query = 'DELETE FROM sessions WHERE user_id = $1';
    await pool.query(query, [userId]);
  }

  // Clean up expired sessions (older than 30 days)
  static async cleanupExpired() {
    const query = `DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '30 days'`;
    await pool.query(query);
  }
}

export default Session;
