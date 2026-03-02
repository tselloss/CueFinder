import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

const API_BASE_URL = API_BASE;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getSellerProfile(id) {
  const res = await axios.get(`${API_BASE_URL}/sellers/${id}`);
  return res.data;
}

export async function createReview(sellerId, data) {
  const res = await axios.post(`${API_BASE_URL}/sellers/${sellerId}/reviews`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function checkMyReview(sellerId, listingType, listingId) {
  const res = await axios.get(`${API_BASE_URL}/sellers/${sellerId}/review-check`, {
    params: { listingType, listingId },
    headers: getAuthHeaders(),
  });
  return res.data;
}
