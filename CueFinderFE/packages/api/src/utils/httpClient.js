import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  clearStoredValues,
  getStoredValue,
  setStoredValue,
} from '@cuefinder/storage';

const DEFAULT_TIMEOUT = 30000;

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export function getToken() {
  return getStoredValue(AUTH_TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  void setStoredValue(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuth() {
  void clearStoredValues([AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY]);
}

export function getAuthHeaders(headers = {}) {
  const token = getToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

export async function makeRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(headers),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data = null;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      if (data) {
        if (data.title) {
          errorMessage = data.detail && data.detail !== data.title ? data.detail : data.title;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.problemDetails = data;

      if (response.status === 401) {
        clearAuth();
        if (unauthorizedHandler) {
          unauthorizedHandler(error);
        }
      }

      throw error;
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

export function get(url, options = {}) {
  return makeRequest(url, { ...options, method: 'GET' });
}

export function post(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'POST', body });
}

export function put(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'PUT', body });
}

export function delete_(url, options = {}) {
  return makeRequest(url, { ...options, method: 'DELETE' });
}

export function patch(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'PATCH', body });
}