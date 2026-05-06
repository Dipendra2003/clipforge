import pool from '../config/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * FRESH MIGRATION SYSTEM
 * ⚠️ WARNING: This will DROP ALL TABLES and DELETE ALL DATA!
 * - Use only for fresh development setup
 * - Never use in production
 * - All existing data will be lost
 */

async function runMigrations() {
  try {
    console.log('🚀 Starting ClipForge FRESH database setup...\n');
    console.log('⚠️  WARNING: This will DROP ALL EXISTING TABLES!\n');

    // Create extension
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✓ UUID extension created');

    // Drop existing tables in correct order (respecting foreign keys)
    await pool.query(`
      DROP TABLE IF EXISTS notification_preferences CASCADE;
      DROP TABLE IF EXISTS analytics_snapshots CASCADE;
      DROP TABLE IF EXISTS published_posts CASCADE;
      DROP TABLE IF EXISTS platform_connections CASCADE;
      DROP TABLE IF EXISTS clips CASCADE;
      DROP TABLE IF EXISTS videos CASCADE;
      DROP TABLE IF EXISTS tokens CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    console.log('✓ Dropped existing tables');

    // ============================================
    // CREATE USERS TABLE
    // ============================================
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

    // ============================================
    // CREATE SESSIONS TABLE
    // ============================================
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

    // ============================================
    // CREATE TOKENS TABLE
    // ============================================
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

    // ============================================
    // CREATE VIDEOS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE videos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('upload', 'youtube', 'twitter', 'facebook', 'instagram', 'tiktok', 'url')),
        source_url TEXT,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        duration INTEGER DEFAULT 0,
        file_size BIGINT DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        error_message TEXT,
        has_subtitles BOOLEAN DEFAULT false,
        subtitle_path TEXT,
        cloud_url TEXT,
        thumbnail_cloud_url TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created videos table (supports: upload, youtube, twitter, facebook, instagram, tiktok, url)');

    // ============================================
    // CREATE CLIPS TABLE
    // ============================================
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
        cloud_url TEXT,
        cloudinary_public_id TEXT,
        emotion VARCHAR(50),
        viral_score DECIMAL(5,2) CHECK (viral_score >= 0 AND viral_score <= 100),
        transcript TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'posted')),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created clips table');

    // ============================================
    // CREATE PLATFORM_CONNECTIONS TABLE
    // ============================================
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
    console.log('✓ Created platform_connections table (YouTube & Instagram)');

    // ============================================
    // CREATE PUBLISHED_POSTS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE published_posts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
        platform_video_id VARCHAR(255),
        platform_url TEXT,
        title VARCHAR(255),
        caption TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'published', 'failed', 'scheduled', 'cancelled')),
        error_message TEXT,
        scheduled_for TIMESTAMP,
        is_scheduled BOOLEAN DEFAULT FALSE,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        watch_time_seconds INTEGER DEFAULT 0,
        avg_view_duration DECIMAL(5,2) DEFAULT 0,
        click_through_rate DECIMAL(5,2) DEFAULT 0,
        reach_count INTEGER DEFAULT 0,
        saved_count INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        last_synced_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created published_posts table (YouTube & Instagram with full analytics)');

    // ============================================
    // CREATE ANALYTICS_SNAPSHOTS TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE analytics_snapshots (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        post_id UUID NOT NULL REFERENCES published_posts(id) ON DELETE CASCADE,
        snapshot_date DATE NOT NULL,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        watch_time_seconds INTEGER DEFAULT 0,
        dislikes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, snapshot_date)
      )
    `);
    console.log('✓ Created analytics_snapshots table');

    // ============================================
    // CREATE NOTIFICATION_PREFERENCES TABLE
    // ============================================
    await pool.query(`
      CREATE TABLE notification_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email_notifications BOOLEAN DEFAULT TRUE,
        processing_complete BOOLEAN DEFAULT TRUE,
        scheduled_posts BOOLEAN DEFAULT TRUE,
        marketing_emails BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);
    console.log('✓ Created notification_preferences table');

    // ============================================
    // CREATE INDEXES
    // ============================================
    await pool.query(`
      -- Users indexes
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_google_id ON users(google_id);
      
      -- Sessions indexes
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
      
      -- Tokens indexes
      CREATE INDEX idx_tokens_token ON tokens(token);
      CREATE INDEX idx_tokens_user_id ON tokens(user_id);
      CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);
      
      -- Videos indexes
      CREATE INDEX idx_videos_user_id ON videos(user_id);
      CREATE INDEX idx_videos_status ON videos(status);
      CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
      CREATE INDEX idx_videos_source_type ON videos(source_type);
      CREATE INDEX idx_videos_cloud_url ON videos(cloud_url) WHERE cloud_url IS NOT NULL;
      
      -- Clips indexes
      CREATE INDEX idx_clips_video_id ON clips(video_id);
      CREATE INDEX idx_clips_user_id ON clips(user_id);
      CREATE INDEX idx_clips_status ON clips(status);
      CREATE INDEX idx_clips_viral_score ON clips(viral_score DESC);
      CREATE INDEX idx_clips_created_at ON clips(created_at DESC);
      CREATE INDEX idx_clips_emotion ON clips(emotion);
      CREATE INDEX idx_clips_cloud_url ON clips(cloud_url) WHERE cloud_url IS NOT NULL;
      
      -- Platform connections indexes
      CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id);
      CREATE INDEX idx_platform_connections_platform ON platform_connections(platform);
      CREATE INDEX idx_platform_connections_expires_at ON platform_connections(expires_at);
      
      -- Published posts indexes
      CREATE INDEX idx_published_posts_user_id ON published_posts(user_id);
      CREATE INDEX idx_published_posts_clip_id ON published_posts(clip_id);
      CREATE INDEX idx_published_posts_platform ON published_posts(platform);
      CREATE INDEX idx_published_posts_status ON published_posts(status);
      CREATE INDEX idx_published_posts_created_at ON published_posts(created_at DESC);
      CREATE INDEX idx_published_posts_clip_platform ON published_posts(clip_id, platform);
      CREATE INDEX idx_published_posts_user_platform ON published_posts(user_id, platform);
      CREATE INDEX idx_published_posts_scheduled ON published_posts(status, scheduled_for) WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;
      CREATE INDEX idx_published_posts_views ON published_posts(views_count DESC);
      CREATE INDEX idx_published_posts_likes ON published_posts(likes_count DESC);
      CREATE INDEX idx_published_posts_dislikes ON published_posts(dislikes_count DESC);
      CREATE INDEX idx_published_posts_last_synced ON published_posts(last_synced_at);
      
      -- Analytics snapshots indexes
      CREATE INDEX idx_analytics_snapshots_post_id ON analytics_snapshots(post_id);
      CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date DESC);
      CREATE INDEX idx_analytics_snapshots_post_date ON analytics_snapshots(post_id, snapshot_date);
      
      -- Notification preferences indexes
      CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
    `);
    console.log('✓ Created indexes (38+ total)');

    // ============================================
    // CREATE TRIGGER FUNCTION
    // ============================================
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

    // ============================================
    // CREATE TRIGGERS
    // ============================================
    await pool.query(`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      CREATE TRIGGER update_videos_updated_at 
        BEFORE UPDATE ON videos
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      CREATE TRIGGER update_clips_updated_at 
        BEFORE UPDATE ON clips
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      CREATE TRIGGER update_platform_connections_updated_at 
        BEFORE UPDATE ON platform_connections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      CREATE TRIGGER update_published_posts_updated_at 
        BEFORE UPDATE ON published_posts
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
      CREATE TRIGGER update_notification_preferences_updated_at 
        BEFORE UPDATE ON notification_preferences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✓ Created triggers (6 total)');

    console.log('\n✅ Database setup complete!\n');
    console.log('📋 Tables created:');
    console.log('   - users, sessions, tokens');
    console.log('   - videos, clips');
    console.log('   - platform_connections (YouTube & Instagram)');
    console.log('   - published_posts, analytics_snapshots');
    console.log('   - notification_preferences');
    console.log('📊 Indexes: 38+ indexes for optimal performance');
    console.log('⚡ Triggers: 6 auto-update triggers');
    console.log('🌐 Platforms: YouTube & Instagram support enabled\n');
    console.log('⚠️  IMPORTANT: Run "node scripts/createAdmin.js" to set up your admin account\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigrations();
