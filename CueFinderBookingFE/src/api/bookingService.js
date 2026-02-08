const API_BASE_URL = import.meta.env.VITE_BOOKING_API_BASE_URL || 'http://localhost:5202';
const getToken = () => localStorage.getItem('authToken');

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
    const message = await response.text();
    throw new Error(message || 'Request failed');
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

export const deleteBooking = (id) => request(`/api/bookings/${id}`, {
  method: 'DELETE'
});
