/**
 * HTTP Request Helper Utility
 * Centralized place for making HTTP requests with common configurations
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Get the stored JWT token from localStorage
 */
export function getToken() {
  return localStorage.getItem('authToken');
}

/**
 * Store JWT token in localStorage
 */
export function setToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

/**
 * Make HTTP request with JWT token and error handling
 */
export async function makeRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const token = getToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

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
      const error = new Error(
        data?.message || data?.error || `HTTP ${response.status}`
      );
      error.status = response.status;
      error.data = data;

      // If unauthorized, clear auth and redirect to login
      if (response.status === 401) {
        clearAuth();
        window.location.href = '/';
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

/**
 * Make GET request
 */
export function get(url, options = {}) {
  return makeRequest(url, { ...options, method: 'GET' });
}

/**
 * Make POST request
 */
export function post(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'POST', body });
}

/**
 * Make PUT request
 */
export function put(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'PUT', body });
}

/**
 * Make DELETE request
 */
export function delete_(url, options = {}) {
  return makeRequest(url, { ...options, method: 'DELETE' });
}

/**
 * Make PATCH request
 */
export function patch(url, body, options = {}) {
  return makeRequest(url, { ...options, method: 'PATCH', body });
}
