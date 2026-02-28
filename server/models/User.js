import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  // Create a new user
  static async create({ name, email, password, googleId = null, role = 'user' }) {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    const query = `
      INSERT INTO users (name, email, password, google_id, role, email_verified, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, name, email, role, email_verified, google_id, created_at
    `;
    
    const values = [name, email, hashedPassword, googleId, role, googleId ? true : false];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, name, email, role, email_verified, google_id, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find user by Google ID
  static async findByGoogleId(googleId) {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await pool.query(query, [googleId]);
    return result.rows[0];
  }

  // Link Google account to existing user
  static async linkGoogleAccount(userId, googleId) {
    const query = 'UPDATE users SET google_id = $1, email_verified = true WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [googleId, userId]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update email verification status
  static async verifyEmail(userId) {
    const query = 'UPDATE users SET email_verified = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Update password
  static async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE users SET password = $1 WHERE id = $2 RETURNING id';
    const result = await pool.query(query, [hashedPassword, userId]);
    return result.rows[0];
  }

  // Delete user
  static async delete(userId) {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [userId]);
  }
}

export default User;
