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

export const getBookings = (params = {}) => {
  const query = new URLSearchParams();
  if (params.recordId) query.set('recordId', params.recordId);
  if (params.tableId) query.set('tableId', params.tableId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const queryString = query.toString();
  return request(`/api/bookings${queryString ? `?${queryString}` : ''}`);
};

export const getMyBookings = () => request('/api/bookings/mine');

export const getAvailability = (params = {}) => {
  const query = new URLSearchParams();
  if (params.tableId) query.set('tableId', params.tableId);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const queryString = query.toString();
  return request(`/api/bookings/availability${queryString ? `?${queryString}` : ''}`);
};

export const createBooking = (payload) => request('/api/bookings', {
  method: 'POST',
  body: JSON.stringify(payload)
});

export const updateBooking = (id, payload) => request(`/api/bookings/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});

export const updateMyBooking = (id, payload) => request(`/api/bookings/mine/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});

export const cancelMyBooking = (id) => request(`/api/bookings/mine/${id}/cancel`, {
  method: 'POST'
});

export const deleteBooking = (id) => request(`/api/bookings/${id}`, {
  method: 'DELETE'
});
