/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    CURRENT_USER: `${API_BASE_URL}/auth/me`,
    GET_USER: (id) => `${API_BASE_URL}/auth/${id}`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/me`,
    VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,
    SEND_SMS: `${API_BASE_URL}/auth/send-sms`,
    VERIFY_SMS: `${API_BASE_URL}/auth/verify-sms`,
  },
  // Cue endpoints
  CUES: {
    LIST: `${API_BASE_URL}/cues`,
    GET: (id) => `${API_BASE_URL}/cues/${id}`,
    CREATE: `${API_BASE_URL}/cues`,
    UPDATE: (id) => `${API_BASE_URL}/cues/${id}`,
    DELETE: (id) => `${API_BASE_URL}/cues/${id}`,
    SEARCH: `${API_BASE_URL}/cues/search`,
  },
  // User endpoints
  USERS: {
    PROFILE: (id) => `${API_BASE_URL}/users/${id}`,
  },
  // Rating endpoints
  RATINGS: {
    LIST: `${API_BASE_URL}/ratings`,
    CREATE: `${API_BASE_URL}/ratings`,
    UPDATE: (id) => `${API_BASE_URL}/ratings/${id}`,
    DELETE: (id) => `${API_BASE_URL}/ratings/${id}`,
  },
};

export const API_BASE = API_BASE_URL;
