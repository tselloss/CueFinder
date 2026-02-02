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

export async function getCueCases() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue cases:', error);
    throw error;
  }
}

export async function getCueCaseById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue case:', error);
    throw error;
  }
}

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
        },
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
    if (error.response?.data?.errorMessage) {
      const nsfwError = new Error(error.response.data.errorMessage);
      nsfwError.isNSFW = true;
      throw nsfwError;
    }
    throw error;
  }
}

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

export async function searchCueCases(query) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cuecases/search`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching cue cases:', error);
    throw error;
  }
}
