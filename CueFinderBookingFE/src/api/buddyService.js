const API_BASE_URL = import.meta.env.VITE_BOOKING_API_BASE_URL || 'http://localhost:5202';
const getToken = () => localStorage.getItem('authToken');

const parseErrorMessage = async (response) => {
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (data.errors) {
      const details = Object.values(data.errors).flat();
      if (details.length) return details[0];
    }
    return data.title || data.message || data.detail || text || `Error ${response.status}`;
  } catch {
    return text || `Error ${response.status}`;
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(options.headers || {})
    },
    credentials: 'include',
    ...options
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) return null;
  return response.json();
};

export const getPosts = (level, locationName) => {
  const params = new URLSearchParams();
  if (level) params.set('level', level);
  if (locationName) params.set('locationName', locationName);
  const qs = params.toString();
  return request(`/api/buddy${qs ? `?${qs}` : ''}`);
};

export const getMyPosts = () => request('/api/buddy/mine');
export const getMyRequests = () => request('/api/buddy/my-requests');

export const createPost = (dto) => request('/api/buddy', { method: 'POST', body: JSON.stringify(dto) });
export const deletePost = (id) => request(`/api/buddy/${id}`, { method: 'DELETE' });
export const closePost = (id) => request(`/api/buddy/${id}/close`, { method: 'POST' });

export const sendRequest = (postId, dto) =>
  request(`/api/buddy/${postId}/request`, { method: 'POST', body: JSON.stringify(dto) });

export const acceptRequest = (postId, reqId) =>
  request(`/api/buddy/${postId}/requests/${reqId}/accept`, { method: 'POST' });

export const declineRequest = (postId, reqId) =>
  request(`/api/buddy/${postId}/requests/${reqId}/decline`, { method: 'POST' });

export const reviewRequest = (postId, reqId, dto) =>
  request(`/api/buddy/${postId}/requests/${reqId}/review`, { method: 'POST', body: JSON.stringify(dto) });
