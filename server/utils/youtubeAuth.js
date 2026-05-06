import { google } from 'googleapis';
import PlatformConnection from '../models/PlatformConnection.js';
import logger from './logger.js';

const YOUTUBE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/youtube/callback`;

/**
 * Refresh YouTube access token if expired
 * Centralized token refresh logic to avoid duplication
 * @param {Object} connection - Platform connection object
 * @returns {Promise<string>} - New access token
 */
export async function refreshYouTubeToken(connection) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET,
      YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: connection.refresh_token
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update token in database - expiry_date is already a timestamp
    const expiresAt = new Date(credentials.expiry_date);
    await PlatformConnection.updateTokens(
      connection.user_id,
      'youtube',
      credentials.access_token,
      expiresAt
    );

    logger.info('YouTube token refreshed successfully', { 
      userId: connection.user_id,
      expiresAt 
    });

    return credentials.access_token;
  } catch (error) {
    logger.error('Token refresh error', { 
      error: error.message,
      userId: connection.user_id,
      code: error.code 
    });
    
    // If refresh token is invalid, user needs to reconnect
    if (error.code === 400 || error.message.includes('invalid_grant')) {
      throw new Error('YouTube connection expired. Please reconnect your account in Settings.');
    }
    
    throw new Error('Failed to refresh YouTube token. Please try again or reconnect your account.');
  }
}

/**
 * Get YouTube OAuth2 client with credentials
 * @param {Object} connection - Platform connection object
 * @returns {Object} - Configured OAuth2 client
 */
export function getYouTubeOAuth2Client(connection) {
  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token
  });

  return oauth2Client;
}

/**
 * Get YouTube API client
 * @param {Object} connection - Platform connection object
 * @returns {Object} - YouTube API client
 */
export function getYouTubeClient(connection) {
  const oauth2Client = getYouTubeOAuth2Client(connection);
  
  return google.youtube({
    version: 'v3',
    auth: oauth2Client
  });
}

/**
 * Ensure YouTube connection is valid and refresh token if needed
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Valid connection object
 */
export async function ensureValidYouTubeConnection(userId) {
  let connection = await PlatformConnection.findByUserAndPlatform(userId, 'youtube');
  
  if (!connection) {
    throw new Error('YouTube not connected. Please connect your YouTube account in Settings first.');
  }

  // Validate that connection has required data
  if (!connection.platform_user_id || !connection.platform_username) {
    logger.error('Invalid YouTube connection - missing channel data', { userId });
    throw new Error('Invalid YouTube connection. Please reconnect your account in Settings.');
  }

  // Check if token is expired and refresh if needed
  if (PlatformConnection.isTokenExpired(connection)) {
    logger.info('YouTube token expired, refreshing...', { userId });
    try {
      const newAccessToken = await refreshYouTubeToken(connection);
      connection.access_token = newAccessToken;
    } catch (refreshError) {
      logger.error('Token refresh failed', { 
        userId, 
        error: refreshError.message 
      });
      throw refreshError;
    }
  }

  return connection;
}
