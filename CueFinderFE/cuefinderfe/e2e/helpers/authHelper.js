/**
 * Auth Helper Functions for E2E Tests
 * 
 * Provides reusable functions for user registration, login, and cleanup
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:5200/api';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://127.0.0.1:3000';

/**
 * Register a new user via API
 * @param {Object} request - Playwright request context
 * @param {Object} userData - User data object
 * @returns {Promise<Object>} Registration response
 */
async function registerUser(request, userData) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: userData
  });
  
  if (!response.ok()) {
    console.error('Registration failed:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Login a user via API and get JWT token
 * @param {Object} request - Playwright request context
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - User password
 * @returns {Promise<Object>} Login response with token
 */
async function loginUser(request, emailOrUsername, password) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      emailOrUsername,
      password
    }
  });
  
  if (!response.ok()) {
    console.error('Login failed:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Login via UI (browser)
 * @param {Object} page - Playwright page object
 * @param {string} emailOrUsername - Email or username
 * @param {string} password - User password
 */
async function loginViaUI(page, emailOrUsername, password) {
  console.log(`🔑 Logging in user: ${emailOrUsername}`);
  
  // Navigate to home
  await page.goto(`${APP_BASE_URL}`);
  await page.waitForLoadState('networkidle');
  
  // Click login button
  const loginButton = page.locator('button').filter({ hasText: /Login|Sign In/i }).first();
  await loginButton.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Fill email/username
  const emailInput = page.locator('input[type="text"], input[type="email"]').first();
  await emailInput.fill(emailOrUsername);
  
  // Fill password
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);
  
  // Click submit
  const submitButton = page.locator('button').filter({ hasText: /Login|Sign In|Submit/i }).first();
  await submitButton.click();
  
  // Wait for login to complete
  await page.waitForURL(`${APP_BASE_URL}/**`, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  
  console.log('✓ User logged in successfully');
}

/**
 * Register and login in one go via API
 * @param {Object} request - Playwright request context
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Contains user data and token
 */
async function registerAndLogin(request, userData) {
  // Register
  const registerRes = await registerUser(request, userData);
  
  if (!registerRes.data.token) {
    // If no token in register response, try login
    const loginRes = await loginUser(request, userData.email, userData.password);
    return {
      ...userData,
      token: loginRes.data.token,
      userId: loginRes.data.userId || loginRes.data.user?.id
    };
  }
  
  return {
    ...userData,
    token: registerRes.data.token,
    userId: registerRes.data.userId || registerRes.data.user?.id
  };
}

/**
 * Generate unique user data with timestamp
 * @param {string} prefix - Username prefix
 * @returns {Object} User object with unique email/username
 */
function generateUniqueUser(prefix = 'testuser') {
  const timestamp = Date.now();
  return {
    username: `${prefix}_${timestamp}`,
    email: `${prefix}_${timestamp}@test.com`,
    password: 'TestPassword123!',
    name: `${prefix} ${timestamp}`,
    phone: '+15551234567',
    acceptedTerms: true
  };
}

/**
 * Set authentication token in page context
 * @param {Object} page - Playwright page object
 * @param {string} token - JWT token
 */
async function setAuthToken(page, token) {
  if (!token) return;
  
  // Store token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
  }, token);
}

/**
 * Get authentication token from page
 * @param {Object} page - Playwright page object
 * @returns {Promise<string>} JWT token
 */
async function getAuthToken(page) {
  return await page.evaluate(() => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  });
}

/**
 * Check if user is logged in
 * @param {Object} page - Playwright page object
 * @returns {Promise<boolean>} True if logged in
 */
async function isLoggedIn(page) {
  const token = await getAuthToken(page);
  return !!token;
}

/**
 * Logout user
 * @param {Object} page - Playwright page object
 */
async function logout(page) {
  // Look for logout button
  const logoutButton = page.locator('button').filter({ hasText: /Logout|Sign Out|Log Out/i });
  if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await logoutButton.click();
  }
  
  // Clear localStorage
  await page.evaluate(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  });
}

/**
 * Wait for user to be authenticated
 * @param {Object} page - Playwright page object
 * @param {number} timeout - Max time to wait in ms
 */
async function waitForAuthentication(page, timeout = 15000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isLoggedIn(page)) {
      return true;
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Authentication timeout');
}

module.exports = {
  registerUser,
  loginUser,
  loginViaUI,
  registerAndLogin,
  generateUniqueUser,
  setAuthToken,
  getAuthToken,
  isLoggedIn,
  logout,
  waitForAuthentication,
  API_BASE_URL,
  APP_BASE_URL
};
