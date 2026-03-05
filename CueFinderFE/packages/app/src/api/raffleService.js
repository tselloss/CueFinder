import axios from 'axios';
import { API_BASE } from '../config/apiConfig';

const API_BASE_URL = API_BASE;

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Public ─────────────────────────────────────────────────────────────────

export async function getRaffles(status = null) {
  const params = status ? { status } : {};
  const res = await axios.get(`${API_BASE_URL}/raffles`, { params });
  return res.data;
}

export async function getRaffleById(id) {
  const res = await axios.get(`${API_BASE_URL}/raffles/${id}`);
  return res.data;
}

// ── Auth-required ──────────────────────────────────────────────────────────

export async function getMyRaffles() {
  const res = await axios.get(`${API_BASE_URL}/raffles/my-raffles`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function getMyEntries() {
  const res = await axios.get(`${API_BASE_URL}/raffles/my-entries`, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function uploadRaffleImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${API_BASE_URL}/images/upload-standalone`, formData, {
    headers: getAuthHeaders(),
  });
  return res.data; // { success, imageUrl, ... }
}

export async function createRaffle(dto) {
  const res = await axios.post(`${API_BASE_URL}/raffles`, dto, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function updateRaffle(id, dto) {
  const res = await axios.put(`${API_BASE_URL}/raffles/${id}`, dto, {
    headers: getAuthHeaders(),
  });
  return res.data;
}

export async function deleteRaffle(id) {
  await axios.delete(`${API_BASE_URL}/raffles/${id}`, {
    headers: getAuthHeaders(),
  });
}

export async function enterRaffle(raffleId, spotNumber, chosenPaymentMethod) {
  const res = await axios.post(
    `${API_BASE_URL}/raffles/${raffleId}/enter`,
    { spotNumber, chosenPaymentMethod },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function verifyEntry(raffleId, entryId, paymentMethod, paymentReference) {
  const res = await axios.put(
    `${API_BASE_URL}/raffles/${raffleId}/entries/${entryId}/verify`,
    { paymentMethod, paymentReference },
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function drawWinner(raffleId) {
  const res = await axios.post(
    `${API_BASE_URL}/raffles/${raffleId}/draw`,
    {},
    { headers: getAuthHeaders() }
  );
  return res.data;
}

export async function saveWinnerCard(raffleId, canvasBlob) {
  // Upload the PNG blob as a standalone image
  const formData = new FormData();
  formData.append('file', canvasBlob, `raffle-winner-${raffleId}.png`);
  const uploadRes = await axios.post(`${API_BASE_URL}/images/upload-standalone`, formData, {
    headers: getAuthHeaders(),
  });
  const imageUrl = uploadRes.data?.imageUrl;
  if (!imageUrl) throw new Error('Image upload failed');

  // Save the URL on the raffle
  const res = await axios.patch(
    `${API_BASE_URL}/raffles/${raffleId}/winner-card`,
    { imageUrl },
    { headers: getAuthHeaders() }
  );
  return res.data;
}
