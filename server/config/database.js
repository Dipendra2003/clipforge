import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Supabase connection using pg Pool
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? {
    rejectUnauthorized: false
  } : false,
  // Connection pool settings for better stability
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not established
  // Retry settings
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Set timezone to IST (Asia/Kolkata) for consistency
let isConnected = false;

pool.on('connect', (client) => {
  // Set timezone to IST for all connections
  client.query('SET timezone = "Asia/Kolkata"');
  if (!isConnected) {
    console.log('✓ Connected to Supabase PostgreSQL database (Timezone: IST)');
    isConnected = true;
  }
});

pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
  isConnected = false;
});

// Test connection once on startup
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    const dbTime = new Date(result.rows[0].now);
    const istTime = dbTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`✓ Database time (IST): ${istTime}`);
  }
});

export default pool;
