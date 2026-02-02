import axios from 'axios';
import { API_BASE } from '../../config/apiConfig';

const API_BASE_URL = API_BASE;

const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
