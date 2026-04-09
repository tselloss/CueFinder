const normalizeApiBaseUrl = (raw) => {
  const value = (raw || '').trim();
  if (!value) {
    return '';
  }

  const withoutTrailingSlash = value.replace(/\/+$/, '');
  if (/\/api$/i.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

const configuredApiBaseUrl =
  normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_URL) ||
  normalizeApiBaseUrl(process.env.REACT_APP_API_URL) ||
  'https://billiardscuefinder.com/api';

export const API_BASE_URL = configuredApiBaseUrl;
export const API_BASE = configuredApiBaseUrl;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    CURRENT_USER: `${API_BASE_URL}/auth/me`,
    GET_USER: (id) => `${API_BASE_URL}/auth/${id}`,
    UPDATE_PROFILE: `${API_BASE_URL}/auth/me`,
    VERIFY_TOKEN: `${API_BASE_URL}/auth/verify`,
    EXTERNAL_LOGIN: `${API_BASE_URL}/auth/external`,
    PHONE_SEND_VERIFICATION: `${API_BASE_URL}/auth/phone/send-verification`,
    PHONE_VERIFY_CODE: `${API_BASE_URL}/auth/phone/verify-code`,
    PHONE_VERIFY_LINK: (token) => `${API_BASE_URL}/auth/phone/verify-link/${token}`,
    PHONE_RESEND: `${API_BASE_URL}/auth/phone/resend`,
    PHONE_STATUS: (token) => `${API_BASE_URL}/auth/phone/status/${token}`,
  },
  CUES: {
    LIST: `${API_BASE_URL}/cues`,
    GET: (id) => `${API_BASE_URL}/cues/${id}`,
    CREATE: `${API_BASE_URL}/cues`,
    UPDATE: (id) => `${API_BASE_URL}/cues/${id}`,
    DELETE: (id) => `${API_BASE_URL}/cues/${id}`,
    SEARCH: `${API_BASE_URL}/cues/search`,
  },
  ADMIN: {
    USERS: `${API_BASE_URL}/users`,
    USER: (id) => `${API_BASE_URL}/users/${id}`,
  },
  MESSAGES: {
    SEND: `${API_BASE_URL}/messages`,
    INBOX: `${API_BASE_URL}/messages/inbox`,
    SENT: `${API_BASE_URL}/messages/sent`,
    THREAD: (otherUserId, cueId) => {
      const base = `${API_BASE_URL}/messages/thread/${otherUserId}`;
      return cueId ? `${base}?cueId=${cueId}` : base;
    },
    MARK_READ: (id) => `${API_BASE_URL}/messages/${id}/read`,
    REPLY: (id) => `${API_BASE_URL}/messages/${id}/reply`,
    DELETE: (id) => `${API_BASE_URL}/messages/${id}`,
  },
};