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

export const getClubRecords = () => request('/api/clubs');

export const createClubRecord = (data) => request('/api/clubs', {
  method: 'POST',
  body: JSON.stringify(data)
});

export const updateClubRecord = (id, data) => request(`/api/clubs/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const deleteClubRecord = (id) => request(`/api/clubs/${id}`, {
  method: 'DELETE'
});

export const requestClubCoOwner = (id, emailOrUsername) => request(`/api/clubs/${id}/coowners`, {
  method: 'POST',
  body: JSON.stringify({ emailOrUsername })
});

export const approveClubCoOwner = (id, coOwnerId) => request(`/api/clubs/${id}/coowners/${coOwnerId}/approve`, {
  method: 'POST'
});
