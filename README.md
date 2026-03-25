# 🎬 ClipForge AI

**AI-Powered Video Clipping & Social Media Publishing Platform**

Transform long-form videos into viral-ready clips automatically using AI, then publish directly to Instagram, TikTok, YouTube Shorts, and more.

---

## 🌟 Key Features

### 🤖 AI-Powered Video Processing
- **Gemini AI Analysis** - Automatically identifies viral moments and engaging segments
- **Whisper AI Subtitles** - Generates accurate, multi-language subtitles with auto-detection
- **Smart Clipping** - FFmpeg creates professional clips with burned-in subtitles
- **Viral Scoring** - Each clip receives a viral potential score (0-100%)
- **Emotion Detection** - Identifies joy, excitement, surprise, tension, and more
- **Thumbnail Generation** - Auto-generates thumbnails for each clip

### 📱 Social Media Integration
- **Multi-Platform Publishing** - Post to Instagram, TikTok, YouTube, Facebook, Twitter/X
- **OAuth Authentication** - Secure platform connections via OAuth 2.0
- **Scheduled Posts** - Schedule clips for optimal posting times
- **Post Analytics** - Track views, likes, comments, and engagement
- **Bulk Publishing** - Publish multiple clips across platforms simultaneously

### 🎥 Video Management
- **YouTube Download** - Download videos from YouTube/Vimeo/Dailymotion with quality selection (360p to 4K)
- **File Upload** - Support for MP4, MOV, AVI, MKV, WEBM formats (up to 500MB)
- **Quality Selection** - Choose source video quality during download (affects final clip quality)
- **Smart Processing** - FFmpeg-powered clip creation with optimized encoding settings
- **Cloud Storage** - Optional Cloudinary integration for video and clip storage
- **Local Storage** - Automatic cleanup of processed files to save disk space

### 🔐 User Management
- **JWT Authentication** - Secure token-based authentication
- **Google OAuth** - One-click sign-in with Google
- **Email Verification** - Secure account verification system
- **Password Reset** - Secure password recovery flow
- **Role-Based Access** - User and admin roles with different permissions
- **Multi-Device Sessions** - Manage sessions across multiple devices

### 📊 Analytics & Dashboard
- **User Dashboard** - Comprehensive overview of videos, clips, and posts
- **Platform Analytics** - Track performance across all connected platforms
- **Admin Panel** - User management, platform monitoring, and system analytics
- **Video Library** - Organized library of all processed videos and clips
- **Engagement Metrics** - Real-time tracking of post performance

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/downloads/))
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
- **FFmpeg** ([Download](https://ffmpeg.org/download.html))
- **Git** ([Download](https://git-scm.com/downloads))

### Installation

#### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd clipforge
```

#### 2. Install Dependencies

**Backend (Node.js + Python):**
```bash
# Install Node.js dependencies
cd server
npm install

# Install Python dependencies
pip install -r requirements.txt
```

**Frontend (React):**
```bash
cd ../client
npm install
```

#### 3. Environment Configuration

**Server Configuration:**
```bash
cd ../server
cp .env.example .env
```

Edit `server/.env` with your credentials:

```env
# =============================================================================
# REQUIRED CONFIGURATION
# =============================================================================

# Server Configuration
PORT=5000
FLASK_PORT=5001
NODE_ENV=development
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/clipforge

# JWT Secrets (Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-generated-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
ACCESS_TOKEN_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=30d

# Email (Gmail - Use App Password, not regular password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=ClipForge <noreply@clipforge.com>

# Google OAuth (Get from: https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI Configuration (Get from: https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key
USE_GEMINI=true
GEMINI_MODEL=gemini-2.0-flash-exp

# =============================================================================
# OPTIONAL CONFIGURATION
# =============================================================================

# Cloudinary (Cloud Storage - Get from: https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
USE_CLOUD_STORAGE=true

# Instagram Graph API (Get from: https://developers.facebook.com/apps/)
INSTAGRAM_APP_ID=your-meta-app-id
INSTAGRAM_APP_SECRET=your-meta-app-secret

# Security Settings
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
ENABLE_SECURITY_LOGGING=true
ENABLE_RATE_LIMITING=true

# File Upload Settings
MAX_FILE_SIZE=500
ALLOWED_EXTENSIONS=mp4,mov,avi,mkv,webm

# Processing Defaults
DEFAULT_CLIP_DURATION=45
DEFAULT_NUM_CLIPS=5
DEFAULT_VIDEO_QUALITY=720p
DEFAULT_MIN_VIRAL_SCORE=0.5
```

**Client Configuration:**
```bash
cd ../client
cp .env.example .env.local
```

Edit `client/.env.local`:
```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Google OAuth (Must match server configuration)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

#### 4. Database Setup

```bash
cd ../server
node migrations/run-migrations.js
```

This will create all necessary tables and indexes.

#### 5. Start the Application

You'll need **3 terminal windows**:

**Terminal 1 - Flask Server (Video Processing):**
```bash
cd server
python app.py
# Runs on http://localhost:5001
```

**Terminal 2 - Node.js Server (API):**
```bash
cd server
npm start
# Runs on http://localhost:5000
```

**Terminal 3 - React Frontend:**
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

#### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 📖 Usage Guide

### Getting Started

1. **Create an Account**
   - Sign up with email or use Google OAuth
   - Verify your email address

2. **Upload or Download a Video**
   - Go to `/demo` page
   - Upload a video file (MP4, MOV, AVI, MKV, WEBM)
   - Or paste a YouTube URL to download

3. **Process with AI**
   - Click "Generate Viral Clips with AI"
   - Wait for processing (2-5 minutes for a 5-minute video)
   - First run takes longer (Whisper model download)

4. **View Results**
   - Navigate to `/dashboard/videos` to see your videos
   - Click on a video to view generated clips
   - Each clip shows viral score, emotion, and reason

5. **Download or Publish**
   - Download clips directly
   - Or connect social media accounts to publish

### Advanced Features

#### Custom Clip Settings

When processing videos, you can customize:
- **Clip Duration**: 15s, 30s, 45s, 60s, or custom (15-90 seconds)
- **Number of Clips**: Generate 1-10 clips per video
- **Minimum Viral Score**: Filter clips by viral potential (0-100%)
- **Emotion Filter**: Focus on specific emotions (joy, excitement, surprise, tension, inspiration)
- **Processing Mode**: AI-powered, equal division, or custom time ranges
- **Quality**: Choose source video download quality (360p to 4K) - clips inherit this quality
- **Subtitle Language**: Auto-detect or specify language (supports 50+ languages via Whisper AI)
- **Skip Subtitles**: Fast mode - skip subtitle generation for quicker processing

#### Social Media Publishing

1. **Connect Platforms**
   - Go to `/dashboard/settings`
   - Click "Connect" for each platform
   - Authorize via OAuth

2. **Schedule Posts**
   - Select a clip
   - Choose platforms
   - Set publish time
   - Add captions and hashtags

3. **Track Performance**
   - View analytics in `/dashboard/analytics`
   - Monitor engagement metrics
   - Optimize posting strategy

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│                      Port 5173                               │
│  - User Interface                                            │
│  - Authentication UI                                         │
│  - Video Management                                          │
│  - Dashboard & Analytics                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST API
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Node.js Express API                         │
│                      Port 5000                               │
│  - Authentication & Authorization                            │
│  - User Management                                           │
│  - Video/Clip Metadata                                       │
│  - Platform OAuth                                            │
│  - Post Scheduling                                           │
└────────┬───────────────────────────────────┬────────────────┘
         │                                   │
         │                                   │ HTTP Requests
         │                                   │
         │                          ┌────────▼────────┐
         │                          │  Python Flask   │
         │                          │    Port 5001    │
         │                          │                 │
         │                          │ - Video Download│
         │                          │ - AI Processing │
         │                          │ - Clip Creation │
         │                          └─────────────────┘
         │                                   │
         │                                   │
         ▼                                   ▼
┌─────────────────┐              ┌──────────────────┐
│   PostgreSQL    │              │  AI Services     │
│    Database     │              │                  │
│                 │              │ - Whisper AI     │
│ - Users         │              │ - Gemini AI      │
│ - Videos        │              │ - FFmpeg         │
│ - Clips         │              │ - yt-dlp         │
│ - Posts         │              └──────────────────┘
│ - Platforms     │
└─────────────────┘
```

### Technology Stack

#### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

#### Backend (Node.js)
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Google OAuth** - Social authentication
- **Node-cron** - Task scheduling

#### Backend (Python)
- **Flask** - Lightweight web framework
- **OpenAI Whisper** - Speech-to-text AI
- **Google Gemini** - Video analysis AI
- **FFmpeg** - Video processing
- **yt-dlp** - YouTube video downloader
- **MoviePy** - Video editing library
- **Pillow** - Image processing

#### DevOps & Deployment
- **Railway** - Hosting platform
- **Vercel** - Frontend deployment option
- **Neon** - Serverless PostgreSQL
- **Git** - Version control

---

## 📁 Project Structure

```
clipforge/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   │   ├── demo-thumbnail.jpg
│   │   └── demo-video.mp4
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── GoogleSignInButton.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── PostModal.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/             # React context
│   │   │   └── AuthContext.jsx
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin pages
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── Plans.jsx
│   │   │   │   ├── PlatformAnalytics.jsx
│   │   │   │   └── Users.jsx
│   │   │   ├── auth/            # Authentication pages
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── OAuthCallback.jsx
│   │   │   │   ├── ResetPassword.jsx
│   │   │   │   ├── Signup.jsx
│   │   │   │   └── VerifyEmail.jsx
│   │   │   ├── user/            # User dashboard pages
│   │   │   │   ├── Analytics.jsx
│   │   │   │   ├── Clips.jsx
│   │   │   │   ├── DashboardOverview.jsx
│   │   │   │   ├── Scheduled.jsx
│   │   │   │   ├── Settings.jsx
│   │   │   │   ├── Subscription.jsx
│   │   │   │   ├── VideoDetails.jsx
│   │   │   │   └── Videos.jsx
│   │   │   ├── About.jsx
│   │   │   ├── Blog.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── Demo.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Pricing.jsx
│   │   │   ├── Privacy.jsx
│   │   │   └── Terms.jsx
│   │   ├── utils/               # Utility functions
│   │   │   ├── auth.js
│   │   │   ├── helpers.js
│   │   │   ├── toast.js
│   │   │   └── videoUrl.js
│   │   ├── App.jsx              # Main app component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── .env                     # Environment variables
│   ├── index.html               # HTML template
│   ├── package.json             # Dependencies
│   ├── tailwind.config.js       # Tailwind configuration
│   └── vite.config.js           # Vite configuration
│
├── server/                      # Backend
│   ├── config/                  # Configuration
│   │   └── database.js          # Database connection
│   ├── controllers/             # Route controllers
│   │   ├── aiController.js      # AI processing endpoints
│   │   ├── authController.js    # Authentication logic
│   │   ├── platformController.js # Social media integration
│   │   └── postController.js    # Post management
│   ├── downloads/               # Video storage
│   │   └── clips/               # Generated clips
│   ├── logs/                    # Application logs
│   │   ├── app.log
│   │   ├── error.log
│   │   └── security.log
│   ├── middleware/              # Express middleware
│   │   ├── authenticateWithQuery.js
│   │   ├── authMiddleware.js
│   │   ├── csrf.js
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   ├── migrations/              # Database migrations
│   │   ├── run-migrations.js
│   │   ├── schema.sql
│   │   └── README.md
│   ├── models/                  # Database models
│   │   ├── Clip.js
│   │   ├── PlatformConnection.js
│   │   ├── PublishedPost.js
│   │   ├── Session.js
│   │   ├── Token.js
│   │   ├── User.js
│   │   └── Video.js
│   ├── routes/                  # API routes
│   ├── scripts/                 # Utility scripts
│   │   ├── checkClipPaths.js
│   │   ├── clearVideoData.js
│   │   ├── createAdmin.js
│   │   ├── resetDatabase.js
│   │   └── verifyAdmin.js
│   ├── services/                # Background services
│   │   └── scheduler.js         # Post scheduling
│   ├── utils/                   # Utility functions
│   │   ├── cleanup.js
│   │   ├── email.js
│   │   └── logger.js
│   ├── .env                     # Environment variables
│   ├── .env.example             # Environment template
│   ├── app.py                   # Flask server (Python)
│   ├── Server.js                # Express server (Node.js)
│   ├── video_processor.py       # Video processing logic
│   ├── package.json             # Node dependencies
│   └── requirements.txt         # Python dependencies
│
├── .gitignore                   # Git ignore rules
├── README.md                    # This file
├── Procfile                     # Railway deployment
├── railway.json                 # Railway configuration
├── nixpacks.toml                # Nixpacks configuration
└── vercel.json                  # Vercel configuration
```

---

## 🔧 Configuration

### Environment Variables Reference

#### Server Environment Variables (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | Yes | `5000` | Node.js server port |
| `FLASK_PORT` | Yes | `5001` | Python Flask server port |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`) |
| `BACKEND_URL` | Yes | `http://localhost:5000` | Backend API URL |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Frontend URL (for CORS) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | Secret for access tokens (64+ chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Secret for refresh tokens (64+ chars) |
| `ACCESS_TOKEN_EXPIRY` | No | `24h` | Access token expiration time |
| `REFRESH_TOKEN_EXPIRY` | No | `30d` | Refresh token expiration time |
| `SMTP_HOST` | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Yes | `587` | SMTP server port |
| `SMTP_USER` | Yes | - | SMTP username/email |
| `SMTP_PASSWORD` | Yes | - | SMTP password (Gmail App Password) |
| `SMTP_FROM` | No | `ClipForge <noreply@clipforge.com>` | Email sender name |
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth client secret |
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `USE_GEMINI` | No | `true` | Enable/disable Gemini AI |
| `GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model version |
| `CLOUDINARY_CLOUD_NAME` | No | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | - | Cloudinary API secret |
| `USE_CLOUD_STORAGE` | No | `true` | Enable cloud storage |
| `INSTAGRAM_APP_ID` | No | - | Meta/Instagram app ID |
| `INSTAGRAM_APP_SECRET` | No | - | Meta/Instagram app secret |
| `MAX_LOGIN_ATTEMPTS` | No | `5` | Max failed login attempts |
| `LOCKOUT_DURATION_MINUTES` | No | `15` | Account lockout duration |
| `SESSION_CLEANUP_INTERVAL` | No | `24` | Session cleanup interval (hours) |
| `ENABLE_SECURITY_LOGGING` | No | `true` | Enable security event logging |
| `ENABLE_RATE_LIMITING` | No | `true` | Enable API rate limiting |
| `MAX_FILE_SIZE` | No | `500` | Maximum video upload size (MB) |
| `ALLOWED_EXTENSIONS` | No | `mp4,mov,avi,mkv,webm` | Allowed video file formats |
| `DEFAULT_CLIP_DURATION` | No | `45` | Default clip duration (seconds) |
| `DEFAULT_NUM_CLIPS` | No | `5` | Default number of clips to generate |
| `DEFAULT_VIDEO_QUALITY` | No | `720p` | Default video download quality |
| `DEFAULT_MIN_VIRAL_SCORE` | No | `0.5` | Default minimum viral score filter |

**Future Platform Integrations (Optional - Coming Soon):**

| Variable | Description |
|----------|-------------|
| `YOUTUBE_CLIENT_ID` | YouTube Data API v3 client ID |
| `YOUTUBE_CLIENT_SECRET` | YouTube Data API v3 client secret |
| `TIKTOK_CLIENT_KEY` | TikTok API client key |
| `TIKTOK_CLIENT_SECRET` | TikTok API client secret |
| `TWITTER_API_KEY` | Twitter/X API key |
| `TWITTER_API_SECRET` | Twitter/X API secret |
| `TWITTER_BEARER_TOKEN` | Twitter/X bearer token |
| `FACEBOOK_APP_ID` | Facebook API app ID |
| `FACEBOOK_APP_SECRET` | Facebook API app secret |

#### Client Environment Variables (`client/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | Yes | `http://localhost:5000` | Backend API URL |
| `VITE_GOOGLE_CLIENT_ID` | Yes | - | Google OAuth client ID (must match server) |

**Note:** Vite only exposes variables prefixed with `VITE_` to the frontend.

### Getting API Keys & Credentials

#### 1. PostgreSQL Database

**Local Setup (Development):**
```bash
# Install PostgreSQL
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE clipforge;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/clipforge
```

**Remote Setup (Production):**
- [Neon](https://neon.tech/) - Serverless PostgreSQL (Free tier: 0.5 GB)
- [Supabase](https://supabase.com/) - PostgreSQL + Auth (Free tier: 500 MB)
- [Railway](https://railway.app/) - PostgreSQL + Hosting (Free tier: $5 credit)

#### 2. JWT Secrets

Generate strong random secrets:
```bash
# Run this command twice to generate both secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output to `JWT_SECRET` and `JWT_REFRESH_SECRET` in `.env`

#### 3. Google OAuth

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "ClipForge AI"
5. Add authorized redirect URIs:
   ```
   http://localhost:5173/auth/callback
   http://localhost:5000/api/auth/google/callback
   https://your-domain.com/auth/callback (for production)
   ```
6. Copy **Client ID** and **Client Secret**
7. Add to both `server/.env` and `client/.env.local`

#### 4. Gmail App Password (Email Service)

**Setup Steps:**
1. Enable 2-Factor Authentication on your Google account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable "2-Step Verification"
2. Generate App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "ClipForge AI"
   - Click "Generate"
3. Copy the 16-character password (format: `xxxx xxxx xxxx xxxx`)
4. Add to `SMTP_PASSWORD` in `.env` (remove spaces)

**Alternative Email Providers:**
- [SendGrid](https://sendgrid.com/) - 100 emails/day free
- [Mailgun](https://www.mailgun.com/) - 5,000 emails/month free
- [Resend](https://resend.com/) - 3,000 emails/month free

#### 5. Google Gemini AI

**Setup Steps:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" → "Create API key"
4. Copy the API key
5. Add to `GEMINI_API_KEY` in `.env`

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- Sufficient for development and small-scale production

#### 6. Cloudinary (Optional - Cloud Storage)

**Setup Steps:**
1. Sign up at [Cloudinary](https://cloudinary.com/users/register/free)
2. Free tier includes:
   - 25 GB storage
   - 25 GB bandwidth/month
   - 25,000 transformations/month
3. Get credentials from [Console](https://console.cloudinary.com/):
   - Cloud Name
   - API Key
   - API Secret
4. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   USE_CLOUD_STORAGE=true
   ```

**Benefits:**
- Automatic file cleanup (saves local disk space)
- CDN delivery (faster video loading)
- Video transformations
- Scalable storage

#### 7. Instagram Graph API (Optional - For Publishing)

**Setup Steps:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create new app:
   - Click "Create App"
   - Type: "Business"
   - Name: "ClipForge AI"
3. Add products:
   - Facebook Login
   - Instagram Graph API
4. Configure OAuth redirect URI:
   ```
   http://localhost:5000/api/platforms/instagram/callback
   https://your-domain.com/api/platforms/instagram/callback
   ```
5. Get App ID and App Secret from Settings → Basic
6. Add to `.env`:
   ```env
   INSTAGRAM_APP_ID=your-meta-app-id
   INSTAGRAM_APP_SECRET=your-meta-app-secret
   ```

**Requirements:**
- User must have Instagram Creator or Business account
- Instagram account must be connected to a Facebook Page
- App must be in "Live" mode (requires Meta review for production)

**Testing:**
- Use "Development" mode for testing with your own account
- No review needed for development mode

#### 8. YouTube Data API (Optional - Coming Soon)

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Enable **YouTube Data API v3**
3. Create OAuth 2.0 credentials (same project as Google OAuth)
4. Add redirect URI:
   ```
   http://localhost:5000/api/platforms/youtube/callback
   ```
5. Add to `.env`:
   ```env
   YOUTUBE_CLIENT_ID=your-youtube-client-id
   YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
   ```

**Free Tier Limits:**
- 10,000 quota units per day
- 1 video upload = 1,600 units
- Sufficient for ~6 uploads per day

#### 9. Other Platforms (Coming Soon)

**TikTok API:**
- Apply at [TikTok for Developers](https://developers.tiktok.com/)
- Requires business verification
- Video posting available in API v2

**Twitter/X API:**
- Apply at [Twitter Developer Portal](https://developer.twitter.com/)
- Free tier: 1,500 tweets/month
- Elevated access required for media uploads

**Facebook API:**
- Use same Meta app as Instagram
- Supports video posts to Facebook Pages
- Requires page management permissions

---

## 🎛️ Advanced Configuration

### Whisper Model Selection

Edit `server/video_processor.py` line 27:

```python
# Trade-off: Speed vs Accuracy
model = self.load_whisper_model("base")

# Available Models:
# - tiny: ~1GB RAM, 32x faster, 70% accuracy - Best for testing
# - base: ~1GB RAM, 16x faster, 80% accuracy - Recommended (default)
# - small: ~2GB RAM, 6x faster, 85% accuracy - Good balance
# - medium: ~5GB RAM, 2x faster, 90% accuracy - High accuracy
# - large: ~10GB RAM, 1x speed, 95% accuracy - Best quality (very slow)

# Processing Time Examples (5-minute video):
# - tiny: ~30 seconds
# - base: ~1 minute (default)
# - small: ~2-3 minutes
# - medium: ~5-8 minutes
# - large: ~15-20 minutes

# First run downloads model (~40MB for tiny, ~140MB for base, ~460MB for small)
```

**Recommendation**: Use `base` for production, `tiny` for development/testing.

### Video Quality Settings

The quality selection affects the **source video download quality**. Clips inherit the quality of the source video.

**How it works:**
1. **Download Stage** - Quality parameter controls yt-dlp download resolution
   - 2160p (4K) → Downloads 4K video → Clips are 4K
   - 720p (HD) → Downloads 720p video → Clips are 720p
   - 360p → Downloads 360p video → Clips are 360p

2. **Clip Creation** - FFmpeg uses optimized encoding settings (defined in `server/video_processor.py`):

```python
# FFmpeg encoding settings for clips
'-c:v', 'libx264',      # H.264 codec
'-c:a', 'aac',          # AAC audio codec
'-preset', 'fast',      # Encoding speed (ultrafast, fast, medium, slow)
'-crf', '23',           # Quality: 0-51 (lower = better quality, larger file)
                        # 23 = good balance between quality and file size
'-avoid_negative_ts', 'make_zero'  # Fix timestamp issues
```

**To customize clip encoding quality**, edit `server/video_processor.py` line 352-356:
- Lower CRF (18-22) = Higher quality, larger files
- Higher CRF (24-28) = Lower quality, smaller files
- Faster preset = Quicker processing, larger files
- Slower preset = Better compression, smaller files

### Clip Generation Settings

Adjust in the frontend or API request:

```javascript
{
  clipDuration: 45,        // Seconds per clip (15-90s)
  numClips: 5,             // Number of clips to generate (1-10)
  minViralScore: 0.5,      // Minimum viral score (0-1)
  quality: '720p',         // Source video download quality (affects clip quality)
  emotions: ['joy', 'excitement'],  // Filter by emotions
  clipMode: 'ai',          // 'ai' (smart), 'divide' (equal parts), 'range' (custom time)
  startTime: 0,            // Optional: start processing from this time (seconds)
  endTime: 300,            // Optional: end processing at this time (seconds)
  skipSubtitles: false,    // Skip subtitle generation for faster processing
  subtitleLanguage: 'auto' // Auto-detect or specify language code (en, es, fr, etc.)
}
```

**Processing Modes:**
- **AI Mode** - Gemini AI analyzes content and identifies viral moments
- **Divide Mode** - Splits video into equal-duration clips
- **Range Mode** - Creates clips from specific time ranges

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Dipendra Kumar",
  "email": "dipendrastm03@gmail.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "dipendrastm03@gmail.com",
  "password": "SecurePass123!"
}
```

#### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-oauth-token"
}
```

### Video Endpoints

#### Get User Videos
```http
GET /api/videos/my-videos
Authorization: Bearer <access_token>
```

#### Get Video Details
```http
GET /api/videos/:videoId
Authorization: Bearer <access_token>
```

#### Delete Video
```http
DELETE /api/videos/:videoId
Authorization: Bearer <access_token>
```

### Clip Endpoints

#### Get User Clips
```http
GET /api/clips/my-clips
Authorization: Bearer <access_token>
```

#### Get Clips by Video
```http
GET /api/clips/video/:videoId
Authorization: Bearer <access_token>
```

#### Download Clip
```http
GET /api/clips/:clipId/download
Authorization: Bearer <access_token>
```

### Processing Endpoints (Flask)

#### Download YouTube Video
```http
POST http://localhost:5001/download
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=...",
  "quality": "720p"
}
```

#### Upload Video
```http
POST http://localhost:5001/upload
Content-Type: multipart/form-data

video: <file>
```

#### Process Video
```http
POST http://localhost:5001/process
Content-Type: application/json

{
  "videoId": "uuid",
  "userId": "uuid",
  "clipDuration": 45,
  "numClips": 5,
  "quality": "720p",
  "clipMode": "ai",
  "minViralScore": 0.5,
  "emotions": ["joy", "excitement"],
  "skipSubtitles": false,
  "subtitleLanguage": "auto",
  "startTime": 0,
  "endTime": 300
}
```

**Response:**
```json
{
  "success": true,
  "videoId": "uuid",
  "status": "completed",
  "videoInfo": {
    "duration": 300,
    "width": 1280,
    "height": 720,
    "fps": 30
  },
  "detectedLanguage": "en",
  "subtitleUrl": "http://localhost:5001/video/uuid.vtt",
  "thumbnailUrl": "http://localhost:5001/video/uuid_thumb.jpg",
  "clips": [
    {
      "clipNumber": 1,
      "title": "Amazing Moment",
      "startTime": 45.5,
      "endTime": 90.5,
      "duration": 45,
      "emotion": "joy",
      "viralScore": 0.85,
      "reason": "High energy and engaging content",
      "clipUrl": "http://localhost:5001/video/uuid_clip_1.mp4"
    }
  ]
}
```

#### Get Processing Progress
```http
GET http://localhost:5001/progress/:videoId
```

---

## 🐛 Troubleshooting

### Common Issues

#### FFmpeg Not Found
**Error**: `FFmpeg not found in PATH`

**Solution**:
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Add to system PATH
3. Verify: `ffmpeg -version`

#### Whisper Model Download
**Issue**: First processing takes 5+ minutes

**Explanation**: Whisper downloads model on first run (~140MB for base model)

**Solution**: Wait for initial download, subsequent runs will be faster

#### Database Connection Error
**Error**: `Connection refused` or `ECONNREFUSED`

**Solution**:
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Test connection: `psql -d clipforge`

#### Gemini API Error
**Error**: `API key not valid`

**Solution**:
1. Verify `GEMINI_API_KEY` in `.env`
2. Check API key at [Google AI Studio](https://makersuite.google.com/)
3. Ensure billing is enabled

#### YouTube Download Fails
**Error**: `Sign in to confirm` or `Bot detection`

**Solutions**:
1. Update yt-dlp: `pip install --upgrade yt-dlp`
2. Try a different video
3. Use shorter videos (under 10 minutes)
4. Consider using Vimeo or Dailymotion instead

#### Port Already in Use
**Error**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :5000  # or :5001, :5173

# Kill process
kill -9 <PID>
```

#### Email Not Sending
**Error**: `Invalid login` or `Authentication failed`

**Solution**:
1. Use Gmail App Password (not regular password)
2. Enable 2FA on Google account
3. Generate app password at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

### Performance Optimization

#### Slow Processing
- Use smaller Whisper model (`tiny` instead of `base`) in `video_processor.py` line 27
- Enable "Skip Subtitles" mode for 50% faster processing (no subtitle generation)
- Download source video at lower quality (720p or 480p)
- Process shorter videos (under 10 minutes recommended)
- Use faster FFmpeg preset (`ultrafast` or `veryfast`)
- Increase server resources (RAM and CPU)
- First run is always slower (Whisper model download ~140MB)

#### Large File Sizes
- Download source video at lower quality (480p or 360p instead of 1080p/4K)
- Adjust CRF value in `video_processor.py` (increase from 23 to 26-28 for smaller files)
- Use faster preset (`ultrafast` instead of `fast`) for quicker encoding
- Enable Cloudinary storage to automatically delete local files after upload

#### Memory Issues
- Close other applications
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Process videos sequentially, not in parallel

#### File Upload Issues
**Error**: `File too large` or `Invalid file type`

**Solution**:
1. Check file size (default max: 500MB)
2. Verify file format (supported: MP4, MOV, AVI, MKV, WEBM)
3. Adjust limits in `.env`:
   ```env
   MAX_FILE_SIZE=500  # in MB
   ALLOWED_EXTENSIONS=mp4,mov,avi,mkv,webm
   ```
4. For larger files:
   - Compress video before upload
   - Use YouTube download instead
   - Enable Cloudinary for better handling

---

## 🧪 Testing

### Run Database Migrations
```bash
cd server
node migrations/run-migrations.js
```

### Create Admin User
```bash
cd server
node scripts/createAdmin.js
```

### Verify Admin
```bash
node scripts/verifyAdmin.js
```

### Clear Video Data
```bash
node scripts/clearVideoData.js
```

### Reset Database
```bash
node scripts/resetDatabase.js
```

---

## 🚀 Deployment

### Railway Deployment

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL**
   - Click "New"
   - Select "Database" → "PostgreSQL"
   - Copy `DATABASE_URL`

4. **Configure Environment Variables**
   - Go to project settings
   - Add all variables from `.env.example`
   - Set `NODE_ENV=production`

5. **Deploy**
   - Railway auto-deploys on git push
   - Monitor logs in dashboard

### Vercel Deployment (Frontend Only)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd client
vercel
```

3. **Configure Environment**
   - Add `VITE_API_URL` in Vercel dashboard
   - Point to your Railway backend URL

### Environment Variables for Production

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
DATABASE_URL=postgresql://...  # From Railway/Neon
JWT_SECRET=<strong-random-string>
JWT_REFRESH_SECRET=<strong-random-string>
# ... other variables
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Bugs
1. Check existing issues
2. Create detailed bug report
3. Include steps to reproduce
4. Add screenshots if applicable

### Feature Requests
1. Open an issue with `[Feature Request]` tag
2. Describe the feature
3. Explain use case
4. Discuss implementation

### Pull Requests
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- Follow existing code style
- Write clear commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Technologies
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition AI
- [Google Gemini](https://ai.google.dev/) - Video analysis AI
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloader
- [React](https://react.dev/) - Frontend framework
- [Express.js](https://expressjs.com/) - Backend framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

### Inspiration
Built for content creators who want to maximize their reach across social media platforms with AI-powered automation.

---

## 📞 Support

### Documentation
- [Installation Guide](#installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

### Community
- GitHub Issues: [Report bugs or request features](https://github.com/your-repo/issues)
- Discussions: [Ask questions and share ideas](https://github.com/your-repo/discussions)

### Contact
- Email: support@clipforge.ai
- Twitter: [@clipforgeai](https://twitter.com/clipforgeai)
- Discord: [Join our community](https://discord.gg/clipforge)

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ AI-powered video clipping
- ✅ Multi-platform authentication
- ✅ Social media OAuth integration
- ✅ Post scheduling
- ✅ Analytics dashboard
- ✅ Admin panel

### Upcoming Features (v1.1)
- 🔄 Batch video processing
- 🔄 Advanced subtitle customization
- 🔄 More platform integrations (LinkedIn, Pinterest)
- 🔄 Team collaboration features
- 🔄 API for third-party integrations

### Future Plans (v2.0)
- 📋 AI-generated captions and hashtags
- 📋 A/B testing for posts
- 📋 Advanced analytics with ML insights
- 📋 Mobile app (iOS/Android)
- 📋 White-label solution

---

## 📊 Stats

- **Languages**: JavaScript, Python, SQL
- **Frameworks**: React, Express, Flask
- **AI Models**: Whisper, Gemini
- **Database**: PostgreSQL
- **Lines of Code**: ~15,000+
- **Files**: 100+

---

**Made with ❤️ for content creators worldwide**

*Transform your long-form content into viral clips with the power of AI*

---

## 🔗 Quick Links

- [Installation](#installation)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
