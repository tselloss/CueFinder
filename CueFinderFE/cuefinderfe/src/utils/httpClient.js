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
      // Extract error message from Problem Details or fallback formats
      let errorMessage = `HTTP ${response.status}`;
      
      if (data) {
        // RFC 7807 Problem Details format
        if (data.title) {
          errorMessage = data.title;
          // Add detail if available and different from title
          if (data.detail && data.detail !== data.title) {
            errorMessage = data.detail;
          }
        }
        // Fallback to common error formats
        else if (data.message) {
          errorMessage = data.message;
        }
        else if (data.error) {
          errorMessage = data.error;
        }
        // If data has errors object (validation errors)
        else if (data.errors && typeof data.errors === 'object') {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.problemDetails = data; // Store full Problem Details for advanced handling

      // If unauthorized, clear auth and redirect to login
      // BUT don't redirect if this is an auth flow endpoint where user input can cause 401
      // Only redirect for authenticated requests that get 401 (expired session)
      const authFlowEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/validate-reset-token',
        '/auth/phone/verify-code',
        '/auth/phone/send-verification',
        '/auth/external'
      ];
      
      const isAuthFlowEndpoint = authFlowEndpoints.some(endpoint => url.includes(endpoint));
      
      if (response.status === 401 && !isAuthFlowEndpoint) {
        clearAuth();
        window.location.href = '/login';
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
