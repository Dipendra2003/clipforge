import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import PlatformConnection from '../models/PlatformConnection.js';
import logger from '../utils/logger.js';

const INSTAGRAM_API_VERSION = process.env.INSTAGRAM_API_VERSION || 'v21.0';
const INSTAGRAM_GRAPH_API_URL = `https://graph.facebook.com/${INSTAGRAM_API_VERSION}`;

/**
 * Refresh Instagram access token if needed
 */
async function refreshInstagramToken(connection) {
  try {
    // Instagram uses long-lived tokens (60 days)
    // Check if token needs refresh (within 7 days of expiry)
    const daysUntilExpiry = Math.floor((new Date(connection.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry > 7) {
      return connection.access_token;
    }

    // Refresh the long-lived token using the correct endpoint
    // Note: For Instagram, we refresh using the page access token
    const response = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/oauth/access_token`,
      {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: connection.access_token // Use access_token, not refresh_token
        }
      }
    );

    const { access_token, expires_in } = response.data;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);

    await PlatformConnection.updateTokens(
      connection.user_id,
      'instagram',
      access_token,
      expiresAt
    );

    logger.info('Instagram token refreshed for publishing', { userId: connection.user_id });
    return access_token;
  } catch (error) {
    logger.error('Instagram token refresh error', {
      error: error.message,
      response: error.response?.data,
      userId: connection.user_id
    });
    throw error;
  }
}

/**
 * Upload video to Instagram and create media container
 * @param {string} videoUrl - Publicly accessible URL of the video
 * @param {string} caption - Caption for the Reel
 * @param {string} instagramBusinessAccountId - Instagram Business Account ID
 * @param {string} accessToken - Page access token
 * @returns {Promise<string>} - Container ID
 */
async function createInstagramMediaContainer(videoUrl, caption, instagramBusinessAccountId, accessToken) {
  try {
    logger.info('Creating Instagram media container', { 
      instagramBusinessAccountId,
      videoUrl 
    });

    const response = await axios.post(
      `${INSTAGRAM_GRAPH_API_URL}/${instagramBusinessAccountId}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        share_to_feed: true // Also share to main feed
      },
      {
        params: {
          access_token: accessToken
        }
      }
    );

    const containerId = response.data.id;
    logger.info('Instagram media container created', { 
      containerId,
      instagramBusinessAccountId 
    });

    return containerId;
  } catch (error) {
    logger.error('Failed to create Instagram media container', {
      error: error.message,
      response: error.response?.data,
      instagramBusinessAccountId
    });
    throw new Error(error.response?.data?.error?.message || 'Failed to create media container');
  }
}

/**
 * Check container status
 * @param {string} containerId - Container ID
 * @param {string} accessToken - Access token
 * @returns {Promise<object>} - Status object with status_code and error details if any
 */
async function checkContainerStatus(containerId, accessToken) {
  try {
    const response = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${containerId}`,
      {
        params: {
          fields: 'status_code,status',
          access_token: accessToken
        }
      }
    );

    return {
      status_code: response.data.status_code,
      status: response.data.status,
      error: null
    };
  } catch (error) {
    logger.error('Failed to check container status', {
      error: error.message,
      response: error.response?.data,
      containerId
    });
    
    // Return error status instead of throwing
    return {
      status_code: 'ERROR',
      status: 'ERROR',
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Wait for container to be ready (with timeout)
 * @param {string} containerId - Container ID
 * @param {string} accessToken - Access token
 * @param {number} maxWaitTime - Maximum wait time in milliseconds (default: 120000 = 2 minutes)
 * @returns {Promise<object>} - Result object with success status and error message if any
 */
async function waitForContainerReady(containerId, accessToken, maxWaitTime = 120000) {
  const startTime = Date.now();
  const checkInterval = 5000; // Check every 5 seconds
  let lastStatus = null;

  while (Date.now() - startTime < maxWaitTime) {
    const statusResult = await checkContainerStatus(containerId, accessToken);
    lastStatus = statusResult;
    
    logger.info('Container status check', { 
      containerId, 
      status_code: statusResult.status_code,
      elapsed: Math.floor((Date.now() - startTime) / 1000) + 's'
    });

    if (statusResult.status_code === 'FINISHED') {
      return { success: true, status: 'FINISHED' };
    }

    if (statusResult.status_code === 'ERROR') {
      return { 
        success: false, 
        status: 'ERROR',
        error: statusResult.error || 'Container processing failed'
      };
    }

    // Continue waiting for IN_PROGRESS status
    if (statusResult.status_code === 'IN_PROGRESS') {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      continue;
    }

    // Unknown status - wait and retry
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  // Timeout
  return { 
    success: false, 
    status: 'TIMEOUT',
    error: `Container processing timeout after ${maxWaitTime / 1000} seconds. Last status: ${lastStatus?.status_code || 'unknown'}`
  };
}

/**
 * Publish Instagram media container
 * @param {string} containerId - Container ID
 * @param {string} instagramBusinessAccountId - Instagram Business Account ID
 * @param {string} accessToken - Page access token
 * @returns {Promise<string>} - Published media ID
 */
async function publishInstagramContainer(containerId, instagramBusinessAccountId, accessToken) {
  try {
    logger.info('Publishing Instagram container', { 
      containerId,
      instagramBusinessAccountId 
    });

    const response = await axios.post(
      `${INSTAGRAM_GRAPH_API_URL}/${instagramBusinessAccountId}/media_publish`,
      {
        creation_id: containerId
      },
      {
        params: {
          access_token: accessToken
        }
      }
    );

    const mediaId = response.data.id;
    logger.info('Instagram media published', { 
      mediaId,
      containerId,
      instagramBusinessAccountId 
    });

    return mediaId;
  } catch (error) {
    logger.error('Failed to publish Instagram container', {
      error: error.message,
      response: error.response?.data,
      containerId,
      instagramBusinessAccountId
    });
    throw new Error(error.response?.data?.error?.message || 'Failed to publish media');
  }
}

/**
 * Get published media details
 * @param {string} mediaId - Published media ID
 * @param {string} accessToken - Access token
 * @returns {Promise<object>} - Media details
 */
async function getMediaDetails(mediaId, accessToken) {
  try {
    const response = await axios.get(
      `${INSTAGRAM_GRAPH_API_URL}/${mediaId}`,
      {
        params: {
          fields: 'id,media_type,media_url,permalink,timestamp',
          access_token: accessToken
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error('Failed to get media details', {
      error: error.message,
      mediaId
    });
    return null;
  }
}

/**
 * Main function to publish video to Instagram Reels
 * @param {string} videoUrl - Publicly accessible URL of the video
 * @param {string} caption - Caption for the Reel
 * @param {object} connection - Platform connection object
 * @returns {Promise<object>} - Published media details
 */
export async function publishToInstagram(videoUrl, caption, connection) {
  try {
    // Refresh token if needed
    const accessToken = await refreshInstagramToken(connection);
    
    // Get Instagram Business Account ID from metadata
    const instagramBusinessAccountId = connection.metadata?.instagramBusinessAccountId;
    
    if (!instagramBusinessAccountId) {
      throw new Error('Instagram Business Account ID not found');
    }

    logger.info('Starting Instagram publishing process', {
      userId: connection.user_id,
      instagramBusinessAccountId
    });

    // Step 1: Create media container
    const containerId = await createInstagramMediaContainer(
      videoUrl,
      caption,
      instagramBusinessAccountId,
      accessToken
    );

    // Step 2: Wait for container to be ready
    logger.info('Waiting for container to be ready', { containerId });
    const readyResult = await waitForContainerReady(containerId, accessToken);

    if (!readyResult.success) {
      const errorMsg = readyResult.status === 'TIMEOUT' 
        ? 'Instagram is still processing your video. This can take 2-5 minutes for longer videos. Please try publishing again in a few minutes.'
        : `Container processing failed: ${readyResult.error}`;
      throw new Error(errorMsg);
    }

    // Step 3: Publish the container
    const mediaId = await publishInstagramContainer(
      containerId,
      instagramBusinessAccountId,
      accessToken
    );

    // Step 4: Get media details
    const mediaDetails = await getMediaDetails(mediaId, accessToken);

    return {
      success: true,
      mediaId,
      permalink: mediaDetails?.permalink,
      timestamp: mediaDetails?.timestamp,
      containerId
    };
  } catch (error) {
    logger.error('Instagram publishing failed', {
      error: error.message,
      userId: connection.user_id
    });
    throw error;
  }
}

export default {
  publishToInstagram,
  refreshInstagramToken
};
