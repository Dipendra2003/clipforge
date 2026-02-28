import pool from '../config/database.js';

class PlatformConnection {
  // Create or update platform connection (upsert)
  static async upsert({ userId, platform, accessToken, refreshToken, expiresAt, platformUserId, platformUsername, metadata }) {
    const query = `
      INSERT INTO platform_connections 
        (user_id, platform, access_token, refresh_token, expires_at, platform_user_id, platform_username, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, platform) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        platform_user_id = EXCLUDED.platform_user_id,
        platform_username = EXCLUDED.platform_username,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [userId, platform, accessToken, refreshToken, expiresAt, platformUserId, platformUsername, metadata];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find connection by user ID and platform
  static async findByUserAndPlatform(userId, platform) {
    const query = 'SELECT * FROM platform_connections WHERE user_id = $1 AND platform = $2';
    const result = await pool.query(query, [userId, platform]);
    return result.rows[0];
  }

  // Find all connections for a user
  static async findByUserId(userId) {
    const query = 'SELECT * FROM platform_connections WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Update access token (for token refresh)
  static async updateTokens(userId, platform, accessToken, expiresAt) {
    const query = `
      UPDATE platform_connections 
      SET access_token = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $3 AND platform = $4
      RETURNING *
    `;
    const result = await pool.query(query, [accessToken, expiresAt, userId, platform]);
    return result.rows[0];
  }

  // Delete connection
  static async delete(userId, platform) {
    const query = 'DELETE FROM platform_connections WHERE user_id = $1 AND platform = $2';
    await pool.query(query, [userId, platform]);
  }

  // Check if token is expired
  static isTokenExpired(connection) {
    if (!connection.expires_at) return false;
    return new Date(connection.expires_at) <= new Date();
  }
}

export default PlatformConnection;
