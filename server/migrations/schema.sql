-- ============================================
-- CLIPFORGE - COMPLETE DATABASE SCHEMA
-- ============================================
-- This is the complete database schema for ClipForge
-- Run this file to set up the entire database from scratch
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

-- Create UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if any)
-- ============================================
-- This ensures a clean slate. Remove this section if you want to preserve existing data.

DROP TABLE IF EXISTS published_posts CASCADE;
DROP TABLE IF EXISTS platform_connections CASCADE;
DROP TABLE IF EXISTS clips CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- USER MANAGEMENT TABLES
-- ============================================

-- Users table - stores all user accounts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255), -- Nullable for Google OAuth users
    google_id VARCHAR(255) UNIQUE, -- For Google OAuth authentication
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'Stores user account information including OAuth users';
COMMENT ON COLUMN users.password IS 'Hashed password - NULL for OAuth users';
COMMENT ON COLUMN users.google_id IS 'Google OAuth ID for SSO authentication';

-- Sessions table - manages refresh tokens for multi-device support
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    device VARCHAR(500), -- Device information for session tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE sessions IS 'Stores refresh tokens for multi-device session management';
COMMENT ON COLUMN sessions.device IS 'User agent or device identifier';

-- Tokens table - temporary tokens for email verification and password reset
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('verify', 'reset')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE tokens IS 'Stores temporary tokens for email verification and password reset';
COMMENT ON COLUMN tokens.type IS 'Token type: verify (email verification) or reset (password reset)';

-- ============================================
-- VIDEO PROCESSING TABLES
-- ============================================

-- Videos table - stores uploaded and downloaded videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('upload', 'youtube')),
    source_url TEXT, -- Original YouTube URL if applicable
    file_path TEXT NOT NULL, -- Path to video file on server
    thumbnail_path TEXT, -- Path to thumbnail image
    duration INTEGER DEFAULT 0, -- Video duration in seconds
    file_size BIGINT DEFAULT 0, -- File size in bytes
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT, -- Error details if processing failed
    has_subtitles BOOLEAN DEFAULT false,
    subtitle_path TEXT, -- Path to subtitle file (.vtt)
    cloud_url TEXT, -- Cloudinary URL for video file (if uploaded to cloud)
    thumbnail_cloud_url TEXT, -- Cloudinary URL for thumbnail (if uploaded to cloud)
    metadata JSONB, -- Additional video metadata (resolution, codec, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE videos IS 'Stores uploaded and processed videos. Supports both local and cloud storage.';
COMMENT ON COLUMN videos.source_type IS 'Video source: upload (user uploaded) or youtube (downloaded from YouTube)';
COMMENT ON COLUMN videos.status IS 'Processing status: pending, processing, completed, or failed';
COMMENT ON COLUMN videos.cloud_url IS 'Cloudinary URL for video file (if uploaded to cloud)';
COMMENT ON COLUMN videos.thumbnail_cloud_url IS 'Cloudinary URL for thumbnail (if uploaded to cloud)';
COMMENT ON COLUMN videos.metadata IS 'JSON object containing additional video information';

-- Clips table - stores AI-generated viral clips
CREATE TABLE clips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_time INTEGER NOT NULL, -- Clip start time in seconds
    end_time INTEGER NOT NULL, -- Clip end time in seconds
    duration INTEGER NOT NULL, -- Clip duration in seconds
    file_path TEXT NOT NULL, -- Path to clip file on server
    thumbnail_path TEXT, -- Path to clip thumbnail
    cloud_url TEXT, -- Cloudinary URL for clip file (if uploaded to cloud)
    cloudinary_public_id TEXT, -- Cloudinary public ID for file management
    emotion VARCHAR(50), -- AI-detected emotion (joy, excitement, surprise, humor, etc.)
    viral_score DECIMAL(5,2) CHECK (viral_score >= 0 AND viral_score <= 100), -- AI viral potential score (0 to 100)
    transcript TEXT, -- Subtitle text for this clip segment
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'posted')),
    metadata JSONB, -- AI analysis results and additional clip data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clips IS 'Stores AI-generated viral clips from videos. Supports both local and cloud storage.';
COMMENT ON COLUMN clips.emotion IS 'AI-detected emotional tone of the clip';
COMMENT ON COLUMN clips.viral_score IS 'AI-predicted viral potential score (0 = low, 100 = high)';
COMMENT ON COLUMN clips.cloud_url IS 'Cloudinary URL for clip file (if uploaded to cloud)';
COMMENT ON COLUMN clips.cloudinary_public_id IS 'Cloudinary public ID for file management';
COMMENT ON COLUMN clips.status IS 'Clip status: pending, processing, completed, failed, or posted';
COMMENT ON COLUMN clips.metadata IS 'JSON object containing AI analysis results and clip metadata';

-- ============================================
-- PLATFORM INTEGRATION TABLES
-- ============================================

-- Platform connections table - stores OAuth tokens for social media platforms
CREATE TABLE platform_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube', 'instagram')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    platform_user_id VARCHAR(255), -- Platform-specific user ID
    platform_username VARCHAR(255), -- Platform username for display
    metadata JSONB, -- Additional platform-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one connection per platform per user
    UNIQUE(user_id, platform)
);

COMMENT ON TABLE platform_connections IS 'Stores OAuth tokens for connected social media platforms';
COMMENT ON COLUMN platform_connections.platform IS 'Platform name: youtube or instagram';
COMMENT ON COLUMN platform_connections.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN platform_connections.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN platform_connections.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN platform_connections.metadata IS 'Additional platform-specific information';

-- Published posts table - tracks clips posted to social media
CREATE TABLE published_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('youtube')),
    platform_video_id VARCHAR(255), -- YouTube video ID
    platform_url TEXT, -- Public YouTube URL
    title VARCHAR(255), -- Custom title used when posting
    caption TEXT, -- Caption/description text posted with the video
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'published', 'failed', 'scheduled', 'cancelled')),
    error_message TEXT,
    scheduled_for TIMESTAMP, -- IST timestamp when the post should be published
    is_scheduled BOOLEAN DEFAULT FALSE, -- Whether this post is scheduled for future publishing
    metadata JSONB, -- Additional platform-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE published_posts IS 'Tracks clips posted to social media platforms';
COMMENT ON COLUMN published_posts.platform IS 'Platform name: youtube';
COMMENT ON COLUMN published_posts.platform_video_id IS 'Platform-specific video ID (e.g., YouTube video ID)';
COMMENT ON COLUMN published_posts.platform_url IS 'Public URL to view the posted video';
COMMENT ON COLUMN published_posts.title IS 'Custom title used when posting (may differ from clip title)';
COMMENT ON COLUMN published_posts.caption IS 'Caption/description text posted with the video';
COMMENT ON COLUMN published_posts.status IS 'Upload status: pending, uploading, published, failed, scheduled, or cancelled';
COMMENT ON COLUMN published_posts.scheduled_for IS 'IST timestamp when the post should be published (NULL for immediate posts)';
COMMENT ON COLUMN published_posts.is_scheduled IS 'Whether this post is scheduled for future publishing';

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

-- User management indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Video processing indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_videos_source_type ON videos(source_type);

-- Clip indexes
CREATE INDEX idx_clips_video_id ON clips(video_id);
CREATE INDEX idx_clips_user_id ON clips(user_id);
CREATE INDEX idx_clips_status ON clips(status);
CREATE INDEX idx_clips_viral_score ON clips(viral_score DESC);
CREATE INDEX idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX idx_clips_emotion ON clips(emotion);
CREATE INDEX idx_clips_cloud_url ON clips(cloud_url) WHERE cloud_url IS NOT NULL;
CREATE INDEX idx_videos_cloud_url ON videos(cloud_url) WHERE cloud_url IS NOT NULL;

-- Platform integration indexes
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
CREATE INDEX idx_published_posts_scheduled ON published_posts(status, scheduled_for) WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
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

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================

-- Insert a default admin user
-- Email: admin@example.com
-- Password: admin123 (change this in production!)
INSERT INTO users (name, email, password, role, email_verified)
VALUES (
    'Admin User',
    'admin@example.com',
    '$2a$10$rZ5YvqZqZqZqZqZqZqZqZuK5YvqZqZqZqZqZqZqZqZqZqZqZqZqZq',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- Schema setup complete!
