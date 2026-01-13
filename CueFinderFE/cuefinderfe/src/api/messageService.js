import axios from 'axios';
import { API_ENDPOINTS } from '../config/apiConfig';

const getAuthToken = () => localStorage.getItem('authToken');
const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function sendMessage({ recipientId, cueId, subject, content, messageType = 'message' }) {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  };
  const payload = { recipientId, cueId, subject, content, messageType };
  const response = await axios.post(API_ENDPOINTS.MESSAGES.SEND, payload, { headers });
  return response.data;
}

export async function getInbox(unreadOnly = false) {
  const headers = getAuthHeaders();
  const url = unreadOnly ? `${API_ENDPOINTS.MESSAGES.INBOX}?unreadOnly=true` : API_ENDPOINTS.MESSAGES.INBOX;
  const response = await axios.get(url, { headers });
  return response.data;
}

export async function getSent() {
  const headers = getAuthHeaders();
  const response = await axios.get(API_ENDPOINTS.MESSAGES.SENT, { headers });
  return response.data;
}

export async function getThread(otherUserId, cueId) {
  const headers = getAuthHeaders();
  const response = await axios.get(API_ENDPOINTS.MESSAGES.THREAD(otherUserId, cueId), { headers });
  return response.data;
}

export async function markAsRead(id) {
  const headers = getAuthHeaders();
  const response = await axios.post(API_ENDPOINTS.MESSAGES.MARK_READ(id), {}, { headers });
  return response.status === 204;
}
