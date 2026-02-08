const DEFAULT_TIMEOUT = 30000;

export function getToken() {
  return localStorage.getItem('authToken');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
}

export function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
}

export async function makeRequest(url, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    timeout = DEFAULT_TIMEOUT
  } = options;

  const token = getToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
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
      const errorMessage = data?.title || data?.message || data || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
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

export const get = (url, options = {}) => makeRequest(url, { ...options, method: 'GET' });
export const post = (url, body, options = {}) => makeRequest(url, { ...options, method: 'POST', body });
