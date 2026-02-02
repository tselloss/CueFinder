import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

// Canonical API base, e.g.
//  - dev:  http://localhost:5000/api
//  - prod: https://billiardscuefinder.com/api
// Avoid deriving this via string replacement.
const API_BASE_URL = API_BASE;

// Helper to get auth token - use 'authToken' to match httpClient.js
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Mock data fallback for development
let _id = 3;
const store = [
  { id: 1, title: 'REVO', brand: 'Predator', price: 599.99, description: 'High-end carbon cue.', condition: 'Used', location: 'NY, USA', images: [], seller_name: 'Mike', seller_email: 'mike@example.com', seller_phone: '', is_sold: false },
  { id: 2, title: 'Classic', brand: 'Meucci', price: 249.0, description: 'Popular two-piece cue.', condition: 'New', location: 'CA, USA', images: [], seller_name: 'Sara', seller_email: 'sara@example.com', seller_phone: '', is_sold: false },
];

const USE_MOCK = false; // Set to false to use real API

// Get all cues (public)
export async function getCues() {
  if (USE_MOCK) {
    return new Promise((res) => setTimeout(() => res([...store]), 200));
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cues`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cues:', error);
    throw error;
  }
}

// Get single cue by ID (public)
export async function getCueById(id) {
  if (USE_MOCK) {
    const numId = parseInt(id, 10);
    return new Promise((res) => setTimeout(() => res(store.find((s) => s.id === numId) || null), 150));
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cues/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cue:', error);
    throw error;
  }
}

// Get current user's cues (requires auth)
export async function getMyCues() {
  if (USE_MOCK) {
    return new Promise((res) => setTimeout(() => res([...store]), 200));
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/cues/my-cues`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching my cues:', error);
    throw error;
  }
}

// Create new cue (requires auth)
export async function createCue(cueData) {
  if (USE_MOCK) {
    const item = { 
      id: ++_id,
      title: cueData.title || `${cueData.brand || 'Cue'} ${_id}`,
      brand: cueData.brand || '',
      price: Number(cueData.price) || 0,
      description: cueData.description || '',
      condition: cueData.condition || 'Used',
      material: cueData.material || '',
      weight: cueData.weight || '',
      length: cueData.length || '',
      tip_size: cueData.tip_size || '',
      images: Array.isArray(cueData.images) ? cueData.images : (cueData.image ? [cueData.image] : []),
      seller_name: cueData.seller_name || '',
      seller_email: cueData.seller_email || '',
      seller_phone: cueData.seller_phone || '',
      location: cueData.location || '',
      is_sold: !!cueData.is_sold,
    };
    store.unshift(item);
    return new Promise((res) => setTimeout(() => res(item), 120));
  }
  try {
    const response = await axios.post(`${API_BASE_URL}/cues`, cueData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating cue:', error);
    throw error;
  }
}

// Update cue (requires auth + ownership)
export async function updateCue(id, cueData) {
  if (USE_MOCK) {
    const item = store.find((s) => s.id === id);
    if (!item) return null;
    Object.assign(item, cueData);
    return new Promise((res) => setTimeout(() => res(item), 100));
  }
  try {
    const response = await axios.put(`${API_BASE_URL}/cues/${id}`, cueData, {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating cue:', error);
    throw error;
  }
}

// Delete cue (requires auth + ownership)
export async function deleteCue(id) {
  if (USE_MOCK) {
    const idx = store.findIndex((s) => s.id === id);
    if (idx >= 0) store.splice(idx, 1);
    return new Promise((res) => setTimeout(() => res({ success: idx >= 0 }), 100));
  }
  try {
    await axios.delete(`${API_BASE_URL}/cues/${id}`, {
      headers: getAuthHeaders()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting cue:', error);
    throw error;
  }
}

// Upload images for a cue (requires auth)
export async function uploadCueImages(cueId, files, onProgress) {
  const formData = new FormData();
  formData.append('cueId', cueId);
  files.forEach(file => formData.append('file', file));
  
  try {
    const response = await axios.post(
      `${API_BASE_URL}/ext/moderation/upload-image?cueId=${cueId}`,
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
    console.error('Error uploading images:', error);
    // Check if it's an NSFW rejection
    if (error.response?.data?.errorMessage) {
      const nsfwError = new Error(error.response.data.errorMessage);
      nsfwError.isNSFW = true;
      throw nsfwError;
    }
    throw error;
  }
}

// Delete image (requires auth + ownership)
export async function deleteImage(imageId) {
  try {
    await axios.delete(`${API_BASE_URL}/images/${imageId}`, {
      headers: getAuthHeaders()
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

// Set primary image (requires auth + ownership)
export async function setPrimaryImage(imageId) {
  try {
    await axios.put(`${API_BASE_URL}/images/${imageId}/primary`, {}, {
      headers: getAuthHeaders()
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting primary image:', error);
    throw error;
  }
}
