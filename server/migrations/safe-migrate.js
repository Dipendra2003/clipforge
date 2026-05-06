import pool from '../config/database.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * SAFE MIGRATION SYSTEM
 * - Checks what exists before creating
 * - Never drops existing tables
 * - Only adds missing tables/columns
 * - Safe for both fresh installs and updates
 */

// Helper: Check if table exists
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  return result.rows[0].exists;
}

// Helper: Check if column exists
async function columnExists(tableName, columnName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    );
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

// Helper: Check if index exists
async function indexExists(indexName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname = $1
    );
  `, [indexName]);
  return result.rows[0].exists;
}



async function safeMigrate() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting SAFE ClipForge database migration...\n');
    console.log('✅ This migration will NOT drop existing tables');
    console.log('✅ Only missing tables/columns will be added\n');

    // ============================================
    // 1. CREATE EXTENSION
    // ============================================
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✓ UUID extension ensured');

    // ============================================
    // 2. CREATE USERS TABLE
    // ============================================
    if (!(await tableExists('users'))) {
      await client.query(`
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
    } else {
      console.log('⏭️  Users table already exists');
    }

    // ============================================
    // 3. CREATE SESSIONS TABLE
    // ============================================
    if (!(await tableExists('sessions'))) {
      await client.query(`
        CREATE TABLE sessions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token TEXT NOT NULL UNIQUE,
          device VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created sessions table');
    } else {
      console.log('⏭️  Sessions table already exists');
    }

    // ============================================
    // 4. CREATE TOKENS TABLE
    // ============================================
    if (!(await tableExists('tokens'))) {
      await client.query(`
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
    } else {
      console.log('⏭️  Tokens table already exists');
    }

    // ============================================
    // 5. CREATE VIDEOS TABLE
    // ============================================
    if (!(await tableExists('videos'))) {
      await client.query(`
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
      console.log('✓ Created videos table');
    } else {
      console.log('⏭️  Videos table already exists');
      
      // Add missing columns if needed
      if (!(await columnExists('videos', 'cloud_url'))) {
        await client.query(`ALTER TABLE videos ADD COLUMN cloud_url TEXT`);
        console.log('  ✓ Added cloud_url column to videos');
      }
      if (!(await columnExists('videos', 'thumbnail_cloud_url'))) {
        await client.query(`ALTER TABLE videos ADD COLUMN thumbnail_cloud_url TEXT`);
        console.log('  ✓ Added thumbnail_cloud_url column to videos');
      }
    }

    // ============================================
    // 6. CREATE CLIPS TABLE
    // ============================================
    if (!(await tableExists('clips'))) {
      await client.query(`
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
    } else {
      console.log('⏭️  Clips table already exists');
      
      // Add missing columns if needed
      if (!(await columnExists('clips', 'cloud_url'))) {
        await client.query(`ALTER TABLE clips ADD COLUMN cloud_url TEXT`);
        console.log('  ✓ Added cloud_url column to clips');
      }
      if (!(await columnExists('clips', 'cloudinary_public_id'))) {
        await client.query(`ALTER TABLE clips ADD COLUMN cloudinary_public_id TEXT`);
        console.log('  ✓ Added cloudinary_public_id column to clips');
      }
    }

    // ============================================
    // 7. CREATE PLATFORM_CONNECTIONS TABLE
    // ============================================
    if (!(await tableExists('platform_connections'))) {
      await client.query(`
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
    } else {
      console.log('⏭️  Platform_connections table already exists');
      
      // Update constraint to include Instagram if needed
      const hasInstagramConstraint = await client.query(`
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'platform_connections' 
        AND con.conname = 'platform_connections_platform_check'
        AND pg_get_constraintdef(con.oid) LIKE '%instagram%'
      `);
      
      if (hasInstagramConstraint.rows.length === 0) {
        await client.query(`
          ALTER TABLE platform_connections 
          DROP CONSTRAINT IF EXISTS platform_connections_platform_check
        `);
        await client.query(`
          ALTER TABLE platform_connections 
          ADD CONSTRAINT platform_connections_platform_check 
          CHECK (platform IN ('youtube', 'instagram'))
        `);
        console.log('  ✓ Updated platform constraint to include Instagram');
      }
    }

    // ============================================
    // 8. CREATE PUBLISHED_POSTS TABLE
    // ============================================
    if (!(await tableExists('published_posts'))) {
      await client.query(`
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
          last_synced_at TIMESTAMP,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✓ Created published_posts table (YouTube & Instagram)');
    } else {
      console.log('⏭️  Published_posts table already exists');
      
      // Add Instagram-specific columns if missing
      if (!(await columnExists('published_posts', 'reach_count'))) {
        await client.query(`ALTER TABLE published_posts ADD COLUMN reach_count INTEGER DEFAULT 0`);
        console.log('  ✓ Added reach_count column (Instagram analytics)');
      }
      if (!(await columnExists('published_posts', 'saved_count'))) {
        await client.query(`ALTER TABLE published_posts ADD COLUMN saved_count INTEGER DEFAULT 0`);
        console.log('  ✓ Added saved_count column (Instagram analytics)');
      }
      if (!(await columnExists('published_posts', 'dislikes_count'))) {
        await client.query(`ALTER TABLE published_posts ADD COLUMN dislikes_count INTEGER DEFAULT 0`);
        console.log('  ✓ Added dislikes_count column (YouTube analytics)');
      }
      
      // Update constraint to include Instagram if needed
      const hasInstagramConstraint = await client.query(`
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'published_posts' 
        AND con.conname = 'published_posts_platform_check'
        AND pg_get_constraintdef(con.oid) LIKE '%instagram%'
      `);
      
      if (hasInstagramConstraint.rows.length === 0) {
        await client.query(`
          ALTER TABLE published_posts 
          DROP CONSTRAINT IF EXISTS published_posts_platform_check
        `);
        await client.query(`
          ALTER TABLE published_posts 
          ADD CONSTRAINT published_posts_platform_check 
          CHECK (platform IN ('youtube', 'instagram'))
        `);
        console.log('  ✓ Updated platform constraint to include Instagram');
      }
    }

    // ============================================
    // 9. CREATE ANALYTICS_SNAPSHOTS TABLE
    // ============================================
    if (!(await tableExists('analytics_snapshots'))) {
      await client.query(`
        CREATE TABLE analytics_snapshots (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          post_id UUID NOT NULL REFERENCES published_posts(id) ON DELETE CASCADE,
          snapshot_date DATE NOT NULL,
          views_count INTEGER DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          watch_time_seconds INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(post_id, snapshot_date)
        )
      `);
      console.log('✓ Created analytics_snapshots table');
    } else {
      console.log('⏭️  Analytics_snapshots table already exists');
      
      // Add dislikes_count column if missing
      if (!(await columnExists('analytics_snapshots', 'dislikes_count'))) {
        await client.query(`ALTER TABLE analytics_snapshots ADD COLUMN dislikes_count INTEGER DEFAULT 0`);
        console.log('  ✓ Added dislikes_count column to analytics_snapshots');
      }
    }

    // ============================================
    // 10. CREATE NOTIFICATION_PREFERENCES TABLE
    // ============================================
    if (!(await tableExists('notification_preferences'))) {
      await client.query(`
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
      
      // Insert default preferences for existing users
      await client.query(`
        INSERT INTO notification_preferences (user_id, email_notifications, processing_complete, scheduled_posts, marketing_emails)
        SELECT id, TRUE, TRUE, TRUE, FALSE
        FROM users
        ON CONFLICT (user_id) DO NOTHING
      `);
      console.log('  ✓ Created default preferences for existing users');
    } else {
      console.log('⏭️  Notification_preferences table already exists');
    }

    // ============================================
    // 11. CREATE INDEXES (only if missing)
    // ============================================
    console.log('\n📊 Creating indexes (only missing ones)...');
    
    const indexes = [
      { name: 'idx_users_email', sql: 'CREATE INDEX idx_users_email ON users(email)' },
      { name: 'idx_users_google_id', sql: 'CREATE INDEX idx_users_google_id ON users(google_id)' },
      { name: 'idx_sessions_user_id', sql: 'CREATE INDEX idx_sessions_user_id ON sessions(user_id)' },
      { name: 'idx_sessions_refresh_token', sql: 'CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token)' },
      { name: 'idx_tokens_token', sql: 'CREATE INDEX idx_tokens_token ON tokens(token)' },
      { name: 'idx_tokens_user_id', sql: 'CREATE INDEX idx_tokens_user_id ON tokens(user_id)' },
      { name: 'idx_tokens_expires_at', sql: 'CREATE INDEX idx_tokens_expires_at ON tokens(expires_at)' },
      { name: 'idx_videos_user_id', sql: 'CREATE INDEX idx_videos_user_id ON videos(user_id)' },
      { name: 'idx_videos_status', sql: 'CREATE INDEX idx_videos_status ON videos(status)' },
      { name: 'idx_videos_created_at', sql: 'CREATE INDEX idx_videos_created_at ON videos(created_at DESC)' },
      { name: 'idx_videos_source_type', sql: 'CREATE INDEX idx_videos_source_type ON videos(source_type)' },
      { name: 'idx_videos_cloud_url', sql: 'CREATE INDEX idx_videos_cloud_url ON videos(cloud_url) WHERE cloud_url IS NOT NULL' },
      { name: 'idx_clips_video_id', sql: 'CREATE INDEX idx_clips_video_id ON clips(video_id)' },
      { name: 'idx_clips_user_id', sql: 'CREATE INDEX idx_clips_user_id ON clips(user_id)' },
      { name: 'idx_clips_status', sql: 'CREATE INDEX idx_clips_status ON clips(status)' },
      { name: 'idx_clips_viral_score', sql: 'CREATE INDEX idx_clips_viral_score ON clips(viral_score DESC)' },
      { name: 'idx_clips_created_at', sql: 'CREATE INDEX idx_clips_created_at ON clips(created_at DESC)' },
      { name: 'idx_clips_emotion', sql: 'CREATE INDEX idx_clips_emotion ON clips(emotion)' },
      { name: 'idx_clips_cloud_url', sql: 'CREATE INDEX idx_clips_cloud_url ON clips(cloud_url) WHERE cloud_url IS NOT NULL' },
      { name: 'idx_platform_connections_user_id', sql: 'CREATE INDEX idx_platform_connections_user_id ON platform_connections(user_id)' },
      { name: 'idx_platform_connections_platform', sql: 'CREATE INDEX idx_platform_connections_platform ON platform_connections(platform)' },
      { name: 'idx_platform_connections_expires_at', sql: 'CREATE INDEX idx_platform_connections_expires_at ON platform_connections(expires_at)' },
      { name: 'idx_published_posts_user_id', sql: 'CREATE INDEX idx_published_posts_user_id ON published_posts(user_id)' },
      { name: 'idx_published_posts_clip_id', sql: 'CREATE INDEX idx_published_posts_clip_id ON published_posts(clip_id)' },
      { name: 'idx_published_posts_platform', sql: 'CREATE INDEX idx_published_posts_platform ON published_posts(platform)' },
      { name: 'idx_published_posts_status', sql: 'CREATE INDEX idx_published_posts_status ON published_posts(status)' },
      { name: 'idx_published_posts_created_at', sql: 'CREATE INDEX idx_published_posts_created_at ON published_posts(created_at DESC)' },
      { name: 'idx_published_posts_clip_platform', sql: 'CREATE INDEX idx_published_posts_clip_platform ON published_posts(clip_id, platform)' },
      { name: 'idx_published_posts_user_platform', sql: 'CREATE INDEX idx_published_posts_user_platform ON published_posts(user_id, platform)' },
      { name: 'idx_published_posts_scheduled', sql: 'CREATE INDEX idx_published_posts_scheduled ON published_posts(status, scheduled_for) WHERE status = \'scheduled\' AND scheduled_for IS NOT NULL' },
      { name: 'idx_published_posts_views', sql: 'CREATE INDEX idx_published_posts_views ON published_posts(views_count DESC)' },
      { name: 'idx_published_posts_likes', sql: 'CREATE INDEX idx_published_posts_likes ON published_posts(likes_count DESC)' },
      { name: 'idx_published_posts_dislikes', sql: 'CREATE INDEX idx_published_posts_dislikes ON published_posts(dislikes_count DESC)' },
      { name: 'idx_published_posts_last_synced', sql: 'CREATE INDEX idx_published_posts_last_synced ON published_posts(last_synced_at)' },
      { name: 'idx_analytics_snapshots_post_id', sql: 'CREATE INDEX idx_analytics_snapshots_post_id ON analytics_snapshots(post_id)' },
      { name: 'idx_analytics_snapshots_date', sql: 'CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date DESC)' },
      { name: 'idx_analytics_snapshots_post_date', sql: 'CREATE INDEX idx_analytics_snapshots_post_date ON analytics_snapshots(post_id, snapshot_date)' },
      { name: 'idx_notification_preferences_user_id', sql: 'CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id)' }
    ];

    let createdIndexes = 0;
    let skippedIndexes = 0;

    for (const index of indexes) {
      if (!(await indexExists(index.name))) {
        await client.query(index.sql);
        createdIndexes++;
      } else {
        skippedIndexes++;
      }
    }

    console.log(`✓ Created ${createdIndexes} new indexes, skipped ${skippedIndexes} existing`);

    // ============================================
    // 12. CREATE TRIGGER FUNCTION
    // ============================================
    const functionExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
      );
    `);

    if (!functionExists.rows[0].exists) {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $ language 'plpgsql'
      `);
      console.log('✓ Created trigger function');
    } else {
      console.log('⏭️  Trigger function already exists');
    }

    // ============================================
    // 13. CREATE TRIGGERS (only if missing)
    // ============================================
    const triggers = [
      { name: 'update_users_updated_at', table: 'users' },
      { name: 'update_videos_updated_at', table: 'videos' },
      { name: 'update_clips_updated_at', table: 'clips' },
      { name: 'update_platform_connections_updated_at', table: 'platform_connections' },
      { name: 'update_published_posts_updated_at', table: 'published_posts' },
      { name: 'update_notification_preferences_updated_at', table: 'notification_preferences' }
    ];

    let createdTriggers = 0;
    let skippedTriggers = 0;

    for (const trigger of triggers) {
      const triggerExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_trigger 
          WHERE tgname = $1
        );
      `, [trigger.name]);

      if (!triggerExists.rows[0].exists) {
        await client.query(`
          CREATE TRIGGER ${trigger.name} 
          BEFORE UPDATE ON ${trigger.table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        createdTriggers++;
      } else {
        skippedTriggers++;
      }
    }

    console.log(`✓ Created ${createdTriggers} new triggers, skipped ${skippedTriggers} existing`);

    await client.query('COMMIT');

    console.log('\n✅ SAFE migration completed successfully!\n');
    console.log('📋 All tables are up to date');
    console.log('   - users, sessions, tokens');
    console.log('   - videos, clips');
    console.log('   - platform_connections (YouTube & Instagram)');
    console.log('   - published_posts, analytics_snapshots');
    console.log('   - notification_preferences');
    console.log('📊 All indexes are in place (38+ indexes)');
    console.log('⚡ All triggers are active (6 triggers)');
    console.log('🌐 YouTube & Instagram support enabled');
    console.log('💾 No data was lost!\n');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
  }
}

safeMigrate();
