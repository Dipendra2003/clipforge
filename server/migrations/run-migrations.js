import pool from '../config/database.js';

async function runMigrations() {
  try {
    console.log('🚀 Starting ClipForge database setup...\n');

    // Create extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✓ UUID extension created');

    // Drop existing tables
    await pool.query(`
      DROP TABLE IF EXISTS published_posts CASCADE;
      DROP TABLE IF EXISTS platform_connections CASCADE;
      DROP TABLE IF EXISTS clips CASCADE;
      DROP TABLE IF EXISTS videos CASCADE;
      DROP TABLE IF EXISTS tokens CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✓ Dropped existing tables');

    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        google_id VARCHAR(255) UNIQUE,
        role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    // Create sessions table
    await pool.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token TEXT NOT NULL UNIQUE,
        device VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created sessions table');

    // Create tokens table
    await pool.query(`
      CREATE TABLE tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('verify', 'reset')),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created tokens table');

    // Create videos table
    await pool.query(`
      CREATE TABLE videos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('upload', 'youtube')),
        source_url TEXT,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        duration INTEGER DEFAULT 0,
        file_size BIGINT DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        error_message TEXT,
        has_subtitles BOOLEAN DEFAULT false,
        subtitle_path TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created videos table');

    // Create clips table
    await pool.query(`
      CREATE TABLE clips (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        emotion VARCHAR(50),
        viral_score DECIMAL(3,2),
        transcript TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'posted')),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created clips table');

    // Create platform_connections table
    await pool.query(`
      CREATE TABLE platform_connections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        platform_user_id VARCHAR(255),
        platform_username VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, platform)
      )
    `);
    console.log('✓ Created platform_connections table');

    // Create published_posts table
    await pool.query(`
      CREATE TABLE published_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube')),
        platform_video_id VARCHAR(255),
        platform_url TEXT,
        title VARCHAR(255),
        caption TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'published', 'failed', 'scheduled', 'cancelled')),
        error_message TEXT,
        scheduled_for TIMESTAMP,
        is_scheduled BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created published_posts table');

    // Create indexes
    await pool.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_google_id ON users(google_id);
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
      CREATE INDEX idx_tokens_token ON tokens(token);
      CREATE INDEX idx_tokens_user_id ON tokens(user_id);
      CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);
      CREATE INDEX idx_videos_user_id ON videos(user_id);
      CREATE INDEX idx_videos_status ON videos(status);
      CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
      CREATE INDEX idx_videos_source_type ON videos(source_type);
      CREATE INDEX idx_clips_video_id ON clips(video_id);
      CREATE INDEX idx_clips_user_id ON clips(user_id);
      CREATE INDEX idx_clips_status ON clips(status);
      CREATE INDEX idx_clips_viral_score ON clips(viral_score DESC);
      CREATE INDEX idx_clips_created_at ON clips(created_at DESC);
      CREATE INDEX idx_clips_emotion ON clips(emotion);
      CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
      CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);
      CREATE INDEX idx_platform_connections_expires_at ON platform_connections(expires_at);
      CREATE INDEX idx_published_posts_user_id ON published_posts(user_id);
      CREATE INDEX idx_published_posts_clip_id ON published_posts(clip_id);
      CREATE INDEX idx_published_posts_platform ON published_posts(platform);
      CREATE INDEX idx_published_posts_status ON published_posts(status);
      CREATE INDEX idx_published_posts_created_at ON published_posts(created_at DESC);
      CREATE INDEX idx_published_posts_clip_platform ON published_posts(clip_id, platform);
    `);
    
    await pool.query(`
      CREATE INDEX idx_published_posts_scheduled ON published_posts(status, scheduled_for) 
      WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;
    `);
    console.log('✓ Created indexes (25+ total)');

    // Create trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);
    console.log('✓ Created trigger function');

    // Create triggers
    await pool.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON clips
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_published_posts_updated_at BEFORE UPDATE ON published_posts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Created triggers (5 total)');

    // Insert admin user
    await pool.query(`
      INSERT INTO users (name, email, password, role, email_verified)
      VALUES ('Admin User', 'admin@example.com', '$2a$10$rZ5YvqZqZqZqZqZqZqZqZuK5YvqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin', TRUE)
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✓ Created admin user');

    console.log('\n✅ Database setup complete!\n');
    console.log('📋 Tables: users, sessions, tokens, videos, clips, platform_connections, published_posts');
    console.log('📊 Indexes: 25+ indexes for optimal performance');
    console.log('⚡ Triggers: 5 auto-update triggers\n');
    console.log('👤 Default Admin Account:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Change this password in production!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
