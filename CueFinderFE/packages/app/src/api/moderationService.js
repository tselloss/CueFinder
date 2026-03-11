import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

const API_BASE_URL = API_BASE;

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get pending moderation flags
 */
export async function getPendingFlags(limit = 50) {
  try {
    const response = await axios.get(`${API_BASE_URL}/ext/moderation/pending`, {
      params: { limit },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching pending flags:', error);
    throw error;
  }
}

/**
 * Get all flagged images with filters
 */
export async function getFlaggedImages(status = null, skip = 0, take = 50) {
  try {
    const params = { skip, take };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_BASE_URL}/ext/moderation/flagged-images`, { 
      params,
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching flagged images:', error);
    throw error;
  }
}

/**
 * Get banned users with their flagged content count
 */
export async function getBannedUsers(skip = 0, take = 50) {
  try {
    const response = await axios.get(`${API_BASE_URL}/ext/moderation/banned-users`, {
      params: { skip, take },
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching banned users:', error);
    throw error;
  }
}

/**
 * Approve a flagged image
 */
export async function approveFlag(flagId, notes = '') {
  try {
    const response = await axios.post(`${API_BASE_URL}/ext/moderation/approve/${flagId}`, {
      notes
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error approving flag:', error);
    throw error;
  }
}

/**
 * Reject a flagged image (optionally ban user)
 */
export async function rejectFlag(flagId, notes = '', banUser = false) {
  try {
    const response = await axios.post(`${API_BASE_URL}/ext/moderation/reject/${flagId}`, {
      notes,
      ban_user: banUser
    }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting flag:', error);
    throw error;
  }
}

/**
 * Upload an image with moderation check
 */
export async function uploadImage(file, cueId = null, cueCaseId = null) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const params = {};
    if (cueId) params.cueId = cueId;
    if (cueCaseId) params.cueCaseId = cueCaseId;

    const response = await axios.post(`${API_BASE_URL}/ext/moderation/upload-image`, formData, {
      params,
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}
