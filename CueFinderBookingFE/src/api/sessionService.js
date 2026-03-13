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

export const getLiveStatus = (recordId) => {
  const query = recordId ? `?recordId=${recordId}` : '';
  return request(`/api/sessions/live${query}`);
};

export const startSession = (payload) => request('/api/sessions', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const endSession = (id) => request(`/api/sessions/${id}/end`, {
  method: 'PUT'
});

export const getSessionHistory = (params = {}) => {
  const query = new URLSearchParams();
  if (params.recordId) query.set('recordId', params.recordId);
  if (params.tableId) query.set('tableId', params.tableId);
  if (params.page) query.set('page', params.page);
  const qs = query.toString();
  return request(`/api/sessions/history${qs ? `?${qs}` : ''}`);
};

export const getSessionStats = (recordId) => {
  const query = recordId ? `?recordId=${recordId}` : '';
  return request(`/api/sessions/stats${query}`);
};
