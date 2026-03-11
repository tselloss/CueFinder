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

// Get all active accessories (public)
export async function getAccessories(page = 1, pageSize = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories`, {
      params: { page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching accessories:', error);
    throw error;
  }
}

// Get single accessory by ID (public)
export async function getAccessoryById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accessory:', error);
    throw error;
  }
}

// Get current user's accessories (requires auth)
export async function getMyAccessories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/my-accessories`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my accessories:', error);
    throw error;
  }
}

// Search accessories
export async function searchAccessories(query, page = 1, pageSize = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/search`, {
      params: { query, page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching accessories:', error);
    throw error;
  }
}

// Get accessories with filters
export async function getFilteredAccessories(filters = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/filter`, {
      params: {
        accessoryType: filters.accessoryType,
        material: filters.material,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        condition: filters.condition,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered accessories:', error);
    throw error;
  }
}

// Create new accessory (requires auth)
export async function createAccessory(accessoryData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/accessories`, accessoryData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating accessory:', error);
    throw error;
  }
}

// Update accessory (requires auth, must own the accessory)
export async function updateAccessory(id, accessoryData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/accessories/${id}`, accessoryData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating accessory:', error);
    throw error;
  }
}

// Delete accessory (requires auth, must own the accessory)
export async function deleteAccessory(id) {
  try {
    await axios.delete(`${API_BASE_URL}/accessories/${id}`, {
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error('Error deleting accessory:', error);
    throw error;
  }
}

// Mark accessory as sold (requires auth, must own the accessory)
export async function markAccessoryAsSold(id) {
  try {
    const response = await axios.put(`${API_BASE_URL}/accessories/${id}/mark-sold`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error marking accessory as sold:', error);
    throw error;
  }
}

// Get active accessories count
export async function getActiveAccessoriesCount() {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/count/active`);
    return response.data;
  } catch (error) {
    console.error('Error getting active accessories count:', error);
    return 0;
  }
}

// Upload accessory images (requires auth)
export async function uploadAccessoryImages(accessoryId, files, onProgressCallback = null) {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/accessories/${accessoryId}/images`,
      formData,
      {
        headers: getAuthHeaders(),
        onUploadProgress: (progressEvent) => {
          if (onProgressCallback) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgressCallback(percentCompleted);
          }
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading accessory images:', error);
    throw error;
  }
}

// Get accessory images
export async function getAccessoryImages(accessoryId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/accessories/${accessoryId}/images`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accessory images:', error);
    return [];
  }
}

// Set primary image for accessory (requires auth)
export async function setPrimaryImage(accessoryId, imageId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/accessories/${accessoryId}/images/${imageId}/primary`,
      {},
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
}

// Remove accessory image (requires auth)
export async function removeImage(accessoryId, imageId) {
  try {
    await axios.delete(
      `${API_BASE_URL}/accessories/${accessoryId}/images/${imageId}`,
      {
        headers: getAuthHeaders()
      }
    );
    return true;
  } catch (error) {
    console.error('Error removing image:', error);
    throw error;
  }
}

// Remove all accessory images (requires auth)
export async function removeAllImages(accessoryId) {
  try {
    await axios.delete(
      `${API_BASE_URL}/accessories/${accessoryId}/images`,
      {
        headers: getAuthHeaders()
      }
    );
    return true;
  } catch (error) {
    console.error('Error removing all images:', error);
    throw error;
  }
}

// Rate accessory (requires auth)
export async function rateAccessory(accessoryId, rating) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/accessories/${accessoryId}/rate`,
      { rating },
      {
        headers: getAuthHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error rating accessory:', error);
    throw error;
  }
}
