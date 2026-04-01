import axios from 'axios';
import { google } from 'googleapis';
import PlatformConnection from '../models/PlatformConnection.js';
import logger from '../utils/logger.js';

// YouTube OAuth configuration
const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/platform/youtube/callback`;
const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl' // Required to update video metadata (privacy, etc.)
].join(' ');

// Instagram Graph API OAuth configuration (Meta Business App)
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/platform/instagram/callback`;
// Scopes for Instagram Graph API with Business accounts
// Using only basic approved scopes for now
const INSTAGRAM_SCOPES = [
  'email',
  'public_profile',
  'pages_show_list',
  'pages_read_engagement'
].join(',');

// ============================================
// YOUTUBE OAUTH
// ============================================

// Initiate YouTube OAuth flow
export const initiateYouTubeAuth = (req, res) => {
  try {
    // Store user ID in session/state for callback
    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${YOUTUBE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(YOUTUBE_REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(YOUTUBE_SCOPES)}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;

    res.redirect(authUrl);
  } catch (error) {
    logger.error('YouTube auth initiation error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to initiate YouTube authentication' });
  }
};

// YouTube OAuth callback
export const youtubeCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('YouTube OAuth error', { error });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_auth_denied`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_auth_failed`);
    }

    // Decode state to get user ID
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!refresh_token) {
      logger.error('No refresh token received', { userId });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_no_refresh_token`);
    }

    // Get YouTube channel info - CRITICAL VALIDATION
    const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet,contentDetails,status', mine: true },
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // VALIDATION: Check if user has a YouTube channel
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      logger.error('No YouTube channel found', { userId });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_no_channel`);
    }

    const channel = channelResponse.data.items[0];
    const platformUserId = channel.id;
    const platformUsername = channel.snippet.title;
    const channelCustomUrl = channel.snippet.customUrl;

    // VALIDATION: Check if channel can upload videos
    if (channel.status && channel.status.longUploadsStatus === 'disallowed') {
      logger.error('Channel cannot upload long videos', { userId, channelId: platformUserId });
      // Note: This is informational, Shorts are typically allowed even if long uploads aren't
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Save connection to database
    await PlatformConnection.upsert({
      userId,
      platform: 'youtube',
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      platformUserId,
      platformUsername,
      metadata: { 
        channelId: platformUserId, 
        channelTitle: platformUsername,
        channelCustomUrl: channelCustomUrl || null,
        connectedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      }
    });

    logger.authEvent('YOUTUBE_CONNECTED', userId, { 
      channelId: platformUserId,
      channelTitle: platformUsername 
    });

    // Redirect back to settings page with success
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?success=youtube_connected&channel=${encodeURIComponent(platformUsername)}`);
  } catch (error) {
    logger.error('YouTube callback error', { 
      error: error.message,
      response: error.response?.data 
    });
    
    // Handle specific errors
    if (error.response?.status === 401) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_auth_invalid`);
    }
    
    if (error.response?.status === 403) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_api_forbidden`);
    }
    
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=youtube_auth_failed`);
  }
};

// ============================================
// INSTAGRAM GRAPH API OAUTH (Business Accounts)
// ============================================

// Initiate Instagram OAuth flow via Facebook Login
export const initiateInstagramAuth = (req, res) => {
  try {
    // Store user ID in session/state for callback
    const state = Buffer.from(JSON.stringify({ userId: req.user.id })).toString('base64');
    
    // Use Facebook OAuth for Instagram Graph API
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${INSTAGRAM_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}` +
      `&scope=${INSTAGRAM_SCOPES}` +
      `&response_type=code` +
      `&state=${state}`;

    res.redirect(authUrl);
  } catch (error) {
    logger.error('Instagram auth initiation error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to initiate Instagram authentication' });
  }
};

// Instagram Graph API OAuth callback
export const instagramCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      logger.error('Instagram OAuth error', { error, error_description });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_auth_failed`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_auth_failed`);
    }

    // Decode state to get user ID
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Step 1: Exchange code for Facebook access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code
      }
    });

    const { access_token: shortLivedToken } = tokenResponse.data;

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const { access_token: longLivedToken, expires_in } = longLivedResponse.data;

    // Step 3: Get Facebook Pages connected to this user
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken,
        fields: 'id,name,access_token'
      }
    });

    const pages = pagesResponse.data.data;
    
    if (!pages || pages.length === 0) {
      logger.error('No Facebook Pages found', { userId });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_no_pages`);
    }

    // Step 4: Get Instagram Business Account connected to the first page
    // Note: In production, you might want to let user select which page
    const pageAccessToken = pages[0].access_token;
    const pageId = pages[0].id;
    const pageName = pages[0].name;

    const instagramAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: pageAccessToken
      }
    });

    const instagramBusinessAccountId = instagramAccountResponse.data.instagram_business_account?.id;

    if (!instagramBusinessAccountId) {
      logger.error('No Instagram Business Account connected to page', { userId, pageId });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_no_business_account`);
    }

    // Step 5: Get Instagram account details
    const instagramDetailsResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramBusinessAccountId}`, {
      params: {
        fields: 'id,username,name',
        access_token: pageAccessToken
      }
    });

    const { username, name } = instagramDetailsResponse.data;

    // Calculate expiration time (60 days for long-lived token)
    const expiresAt = new Date(Date.now() + (expires_in || 60 * 24 * 60 * 60) * 1000);

    // Step 6: Save connection to database
    await PlatformConnection.upsert({
      userId,
      platform: 'instagram',
      accessToken: pageAccessToken, // Use page access token for Instagram API calls
      refreshToken: longLivedToken, // Store user token for refresh
      expiresAt,
      platformUserId: instagramBusinessAccountId,
      platformUsername: username || name,
      metadata: {
        instagramBusinessAccountId,
        username,
        name,
        pageId,
        pageName,
        facebookUserId: pagesResponse.data.data[0].id
      }
    });

    logger.authEvent('INSTAGRAM_CONNECTED', userId, { 
      instagramBusinessAccountId,
      username,
      pageId 
    });

    // Redirect back to settings page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?success=instagram_connected`);
  } catch (error) {
    logger.error('Instagram callback error', { 
      error: error.message,
      response: error.response?.data 
    });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=instagram_auth_failed`);
  }
};

// ============================================
// PLATFORM CONNECTION MANAGEMENT
// ============================================

// Get all platform connections for user
export const getPlatformConnections = async (req, res) => {
  try {
    const connections = await PlatformConnection.findByUserId(req.user.id);
    
    // Auto-refresh expired YouTube tokens
    const refreshedConnections = await Promise.all(
      connections.map(async (conn) => {
        if (conn.platform === 'youtube' && PlatformConnection.isTokenExpired(conn)) {
          try {
            // Try to refresh the token
            const oauth2Client = new google.auth.OAuth2(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET,
              `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`
            );

            oauth2Client.setCredentials({
              refresh_token: conn.refresh_token
            });

            const { credentials } = await oauth2Client.refreshAccessToken();
            const expiresAt = new Date(credentials.expiry_date);

            // Update token in database
            await PlatformConnection.updateTokens(
              conn.user_id,
              'youtube',
              credentials.access_token,
              expiresAt
            );

            logger.info('YouTube token auto-refreshed', { userId: conn.user_id });

            // Return updated connection
            return {
              ...conn,
              access_token: credentials.access_token,
              expires_at: expiresAt
            };
          } catch (refreshError) {
            logger.error('Auto-refresh failed', { 
              error: refreshError.message, 
              userId: conn.user_id 
            });
            // Return original connection if refresh fails
            return conn;
          }
        }
        return conn;
      })
    );
    
    // Return sanitized data (no tokens)
    const sanitized = refreshedConnections.map(conn => ({
      platform: conn.platform,
      platformUsername: conn.platform_username,
      platformUserId: conn.platform_user_id,
      connected: true,
      expiresAt: conn.expires_at,
      createdAt: conn.created_at,
      isExpired: PlatformConnection.isTokenExpired(conn),
      metadata: conn.metadata // Safe to return as it doesn't contain tokens
    }));

    res.json({ connections: sanitized });
  } catch (error) {
    logger.error('Get platform connections error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to fetch platform connections' });
  }
};

// Disconnect platform
export const disconnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;

    if (!['youtube', 'instagram'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    await PlatformConnection.delete(req.user.id, platform);
    
    logger.authEvent('PLATFORM_DISCONNECTED', req.user.id, { platform });

    res.json({ message: `${platform} disconnected successfully` });
  } catch (error) {
    logger.error('Disconnect platform error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to disconnect platform' });
  }
};
