import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

// Canonical API base, e.g.
//  - dev:  http://localhost:5000/api
//  - prod: https://billiardscuefinder.com/api
// Avoid deriving this via string replacement (can produce "/api/api" in prod).
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

// Get all cue cases (public)
export async function getCueCases() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue cases:', error);
    return [];
  }
}

// Get single cue case by ID (public)
export async function getCueCaseById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue case:', error);
    return null;
  }
}

// Get current user's cue cases (requires auth)
export async function getMyCueCases() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases/my-cases`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my cue cases:', error);
    throw error;
  }
}

// Create new cue case (requires auth)
export async function createCueCase(cueCaseData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/cuecases`, cueCaseData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating cue case:', error);
    throw error;
  }
}

// Update existing cue case (requires auth)
export async function updateCueCase(id, cueCaseData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/cuecases/${id}`, cueCaseData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating cue case:', error);
    throw error;
  }
}

// Delete cue case (requires auth)
export async function deleteCueCase(id) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cuecases/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting cue case:', error);
    throw error;
  }
}

// Upload images for a cue case
export async function uploadCueCaseImages(cueCaseId, files, onProgress) {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/cuecases/${cueCaseId}/images`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          onProgress(percent);
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading cue case images:', error);
    throw error;
  }
}

// Delete a cue case image
export async function deleteCueCaseImage(cueCaseId, imageId) {
  try {
    await axios.delete(`${API_BASE_URL}/cuecases/${cueCaseId}/images/${imageId}`, {
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error('Error deleting cue case image:', error);
    throw error;
  }
}

// Set primary image for a cue case
export async function setPrimaryCueCaseImage(cueCaseId, imageId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/cuecases/${cueCaseId}/images/${imageId}/set-primary`,
      {},
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error setting primary cue case image:', error);
    throw error;
  }
}

// Search cue cases
export async function searchCueCases(query) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases/search`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching cue cases:', error);
    return [];
  }
}
