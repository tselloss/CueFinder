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

// Get all active billiard tables (public)
export async function getTables(page = 1, pageSize = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables`, {
      params: { page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching billiard tables:', error);
    throw error;
  }
}

// Get single billiard table by ID (public)
export async function getTableById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching billiard table:', error);
    throw error;
  }
}

// Get current user's billiard tables (requires auth)
export async function getMyTables() {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables/my-tables`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my billiard tables:', error);
    throw error;
  }
}

// Search billiard tables
export async function searchTables(query, page = 1, pageSize = 20) {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables/search`, {
      params: { q: query, page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching billiard tables:', error);
    throw error;
  }
}

// Get billiard tables with filters
export async function getFilteredTables(filters = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables/filter`, {
      params: {
        tableSize: filters.tableSize,
        tableType: filters.tableType,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        condition: filters.condition,
        page: filters.page || 1,
        pageSize: filters.pageSize || 20
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered billiard tables:', error);
    throw error;
  }
}

// Create new billiard table (requires auth)
export async function createTable(tableData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/billiardtables`, tableData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating billiard table:', error);
    throw error;
  }
}

// Update billiard table (requires auth, must own the table)
export async function updateTable(id, tableData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/billiardtables/${id}`, tableData, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating billiard table:', error);
    throw error;
  }
}

// Delete billiard table (requires auth, must own the table)
export async function deleteTable(id) {
  try {
    await axios.delete(`${API_BASE_URL}/billiardtables/${id}`, {
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error('Error deleting billiard table:', error);
    throw error;
  }
}

// Mark billiard table as sold (requires auth, must own the table)
export async function markTableAsSold(id) {
  try {
    const response = await axios.put(`${API_BASE_URL}/billiardtables/${id}/mark-sold`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error marking table as sold:', error);
    throw error;
  }
}

// Get active billiard tables count
export async function getActiveTablesCount() {
  try {
    const response = await axios.get(`${API_BASE_URL}/billiardtables/count/active`);
    return response.data;
  } catch (error) {
    console.error('Error getting active tables count:', error);
    return 0;
  }
}

// Upload billiard table images (requires auth)
export async function uploadTableImages(tableId, files, onProgressCallback = null) {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await axios.post(
      `${API_BASE_URL}/billiardtables/${tableId}/images`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        },
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
    console.error('Error uploading table images:', error);
    throw error;
  }
}

// Remove billiard table image (requires auth)
export async function removeImage(imageId) {
  try {
    await axios.delete(`${API_BASE_URL}/billiardtables/images/${imageId}`, {
      headers: getAuthHeaders()
    });
    return true;
  } catch (error) {
    console.error('Error removing image:', error);
    throw error;
  }
}

// Set primary image for billiard table (requires auth)
export async function setPrimaryImage(tableId, imageId) {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/billiardtables/${tableId}/set-primary-image`,
      { imageId },
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
