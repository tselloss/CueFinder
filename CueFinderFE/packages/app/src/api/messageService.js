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

export async function replyToMessage(messageId, content) {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  };
  const payload = { content };
  const response = await axios.post(API_ENDPOINTS.MESSAGES.REPLY(messageId), payload, { headers });
  return response.data;
}

export async function deleteMessage(messageId) {
  const headers = getAuthHeaders();
  const response = await axios.delete(API_ENDPOINTS.MESSAGES.DELETE(messageId), { headers });
  return response.status === 204;
}

export async function sendOffer({ recipientId, itemId, bidAmount, originalPrice, itemTitle, personalNote = '' }) {
  const content = JSON.stringify({
    type: 'offer',
    amount: bidAmount,
    originalPrice,
    itemTitle,
    note: personalNote,
  });
  return sendMessage({
    recipientId,
    cueId: itemId,
    subject: `Offer for "${itemTitle}"`,
    content,
    messageType: 'offer',
  });
}

export async function respondToOffer({ recipientId, cueId, action, counterAmount = null, message = '' }) {
  const typeMap = { accepted: 'accepted', rejected: 'rejected', counter: 'counter_offer' };
  const subjectMap = {
    accepted: 'Offer Accepted',
    rejected: 'Offer Declined',
    counter: `Counter Offer: €${counterAmount?.toFixed(2)}`,
  };
  const content = JSON.stringify({ type: action, counterAmount, message });
  return sendMessage({
    recipientId,
    cueId,
    subject: subjectMap[action] || 'Offer Response',
    content,
    messageType: typeMap[action] || 'message',
  });
}
