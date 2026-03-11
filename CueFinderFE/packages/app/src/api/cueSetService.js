import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

const API_BASE_URL = API_BASE;

const getAuthToken = () => localStorage.getItem('authToken');
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getCueSets() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuesets`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue sets:', error);
    return [];
  }
}

export async function getCueSetById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuesets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue set:', error);
    return null;
  }
}

export async function getMyCueSets() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuesets/my-sets`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my cue sets:', error);
    throw error;
  }
}

export async function createCueSet(cueSetData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/cuesets`, cueSetData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating cue set:', error);
    throw error;
  }
}

export async function updateCueSet(id, cueSetData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/cuesets/${id}`, cueSetData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating cue set:', error);
    throw error;
  }
}

export async function deleteCueSet(id) {
  try {
    await axios.delete(`${API_BASE_URL}/cuesets/${id}`, {
      headers: getAuthHeaders()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting cue set:', error);
    throw error;
  }
}

export async function uploadCueSetImages(cueSetId, files, onProgress) {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await axios.post(
      `${API_BASE_URL}/cuesets/${cueSetId}/images`,
      formData,
      {
        headers: getAuthHeaders(),
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          onProgress(percent);
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading cue set images:', error);
    if (error.response?.data?.errorMessage) {
      const nsfwError = new Error(error.response.data.errorMessage);
      nsfwError.isNSFW = true;
      throw nsfwError;
    }
    throw error;
  }
}

export async function deleteCueSetImage(cueSetId, imageId) {
  try {
    await axios.delete(`${API_BASE_URL}/cuesets/${cueSetId}/images/${imageId}`, {
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error('Error deleting cue set image:', error);
    throw error;
  }
}

export async function setPrimaryCueSetImage(cueSetId, imageId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/cuesets/${cueSetId}/images/${imageId}/set-primary`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error setting primary cue set image:', error);
    throw error;
  }
}
