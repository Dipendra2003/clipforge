import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection using pg Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('✓ Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

// Test connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  }
});

export default pool;
