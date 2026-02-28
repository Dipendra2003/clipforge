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
- **YouTube Download** - Download and process YouTube videos directly
- **File Upload** - Support for MP4, MOV, AVI, MKV, WEBM formats
- **Quality Selection** - Choose from 360p to 4K quality
- **Batch Processing** - Process multiple videos simultaneously
- **Cloud Storage** - Secure video and clip storage

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
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/clipforge

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# AI
GEMINI_API_KEY=your-gemini-api-key

# Platform OAuth (Optional - for social media publishing)
INSTAGRAM_APP_ID=your-meta-app-id
INSTAGRAM_APP_SECRET=your-meta-app-secret
```

**Client Configuration:**
```bash
cd ../client
cp .env .env.local
```

Edit `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000
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
- **Clip Duration**: 15s, 30s, 45s, 60s, or custom
- **Number of Clips**: Generate 3-10 clips
- **Minimum Viral Score**: Filter clips by viral potential
- **Emotion Filter**: Focus on specific emotions
- **Quality**: Choose output quality (360p to 4K)
- **Subtitle Language**: Auto-detect or specify language

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

### Environment Variables

#### Server (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
APP_NAME=ClipForge AI

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/clipforge

# JWT Secrets (Generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Platform OAuth (Optional)
INSTAGRAM_APP_ID=your-meta-app-id
INSTAGRAM_APP_SECRET=your-meta-app-secret

# Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
ENABLE_SECURITY_LOGGING=true
ENABLE_RATE_LIMITING=true
```

#### Client (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Getting API Keys

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5000/api/auth/google/callback`

#### Google Gemini AI
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to `GEMINI_API_KEY` in `.env`

#### Gmail App Password
1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password
4. Use it as `EMAIL_PASS` in `.env`

#### Instagram/Meta (Optional)
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add Instagram Graph API product
4. Get App ID and App Secret
5. Configure OAuth redirect URI

---

## 🎛️ Advanced Configuration

### Whisper Model Selection

Edit `server/video_processor.py`:

```python
# Trade-off: Speed vs Accuracy
model = self.load_whisper_model("base")

# Options:
# - tiny: Fastest, least accurate
# - base: Good balance (recommended)
# - small: Better accuracy, slower
# - medium: High accuracy, much slower
# - large: Best accuracy, very slow
```

### Video Quality Settings

Edit `server/video_processor.py`:

```python
# CRF: 0-51 (lower = better quality, larger file)
'-crf', '23',  # Default: 23 (good quality)

# Preset: Speed vs compression
'-preset', 'fast',  # Options: ultrafast, fast, medium, slow
```

### Clip Generation Settings

Adjust in the frontend or API request:

```javascript
{
  clipDuration: 45,        // Seconds per clip
  numClips: 5,             // Number of clips to generate
  minViralScore: 0.5,      // Minimum viral score (0-1)
  quality: '720p',         // Output quality
  emotions: ['joy', 'excitement']  // Filter by emotions
}
```

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
  "quality": "720p"
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
- Use smaller Whisper model (`tiny` or `base`)
- Reduce video quality
- Process shorter videos
- Increase server resources

#### Large File Sizes
- Adjust CRF value (higher = smaller files)
- Use faster preset
- Lower output resolution

#### Memory Issues
- Close other applications
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- Process videos sequentially, not in parallel

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
