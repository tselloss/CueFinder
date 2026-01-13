/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

const normalizeApiBaseUrl = (raw) => {
  const value = (raw || '').trim();
  if (!value) return '';

  // Ensure we don't end up with "/api/api" when env already includes "/api".
  // Accept either:
  //  - https://billiardscuefinder.com      (we'll append /api)
  //  - https://billiardscuefinder.com/api  (leave as-is)
  const withoutTrailingSlash = value.replace(/\/+$/, '');
  if (/\/api$/i.test(withoutTrailingSlash)) return withoutTrailingSlash;
  return `${withoutTrailingSlash}/api`;
};

export const API_BASE_URL =
  normalizeApiBaseUrl(process.env.REACT_APP_API_URL) ||
  'http://localhost:5000/api';

// Public website origin (same host as the API, but without the "/api" prefix).
// Use this when you need to build URLs for static files (e.g. uploaded images at "/uploads/*").
export const SITE_BASE_URL = API_BASE_URL.replace(/\/+api$/i, '');

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
    EXTERNAL_LOGIN: `${API_BASE_URL}/auth/external`,
    // Phone verification endpoints
    PHONE_SEND_VERIFICATION: `${API_BASE_URL}/auth/phone/send-verification`,
    PHONE_VERIFY_CODE: `${API_BASE_URL}/auth/phone/verify-code`,
    PHONE_VERIFY_LINK: (token) => `${API_BASE_URL}/auth/phone/verify-link/${token}`,
    PHONE_RESEND: `${API_BASE_URL}/auth/phone/resend`,
    PHONE_STATUS: (token) => `${API_BASE_URL}/auth/phone/status/${token}`,
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
  // Admin endpoints
  ADMIN: {
    USERS: `${API_BASE_URL}/users`,
    USER: (id) => `${API_BASE_URL}/users/${id}`,
  },
  // Messaging endpoints
  MESSAGES: {
    SEND: `${API_BASE_URL}/messages`,
    INBOX: `${API_BASE_URL}/messages/inbox`,
    SENT: `${API_BASE_URL}/messages/sent`,
    THREAD: (otherUserId, cueId) => {
      const base = `${API_BASE_URL}/messages/thread/${otherUserId}`;
      return cueId ? `${base}?cueId=${cueId}` : base;
    },
    MARK_READ: (id) => `${API_BASE_URL}/messages/${id}/read`,
  },
};

export const API_BASE = API_BASE_URL;
