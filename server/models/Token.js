
import crypto from 'crypto';
import pool from '../config/database.js'
class Token {
  // Create a new token (for email verification or password reset)
  static async create(userId, type, expiresInMinutes = 60) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const query = `
      INSERT INTO tokens (user_id, token, type, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, token, type, expiresAt]);
    return result.rows[0];
  }

  // Create OTP (6-digit code)
  static async createOTP(userId, type, expiresInMinutes = 15) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const query = `
      INSERT INTO tokens (user_id, token, type, expires_at, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [userId, otp, type, expiresAt]);
    return result.rows[0];
  }

  // Find token by value and type
  static async findByToken(token, type) {
    const query = `
      SELECT * FROM tokens 
      WHERE token = $1 AND type = $2 AND expires_at > NOW()
    `;
    const result = await pool.query(query, [token, type]);
    return result.rows[0];
  }

  // Delete a specific token
  static async delete(token) {
    const query = 'DELETE FROM tokens WHERE token = $1';
    await pool.query(query, [token]);
  }

  // Delete all tokens for a user of a specific type
  static async deleteByUserIdAndType(userId, type) {
    const query = 'DELETE FROM tokens WHERE user_id = $1 AND type = $2';
    await pool.query(query, [userId, type]);
  }

  // Clean up expired tokens
  static async cleanupExpired() {
    const query = 'DELETE FROM tokens WHERE expires_at < NOW()';
    await pool.query(query);
  }
}

export default Token;
