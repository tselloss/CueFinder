/**
 * Authentication API service
 * Connects to the CueFinderBE Auth API endpoints
 */

import { API_ENDPOINTS } from '../config/apiConfig';
import { post, get, put, setToken, getToken, clearAuth } from '../utils/httpClient';

// Export getToken and clearAuth for use in AuthContext
export { getToken, clearAuth };

let currentUser = null;

/**
 * Login with username and password
 */
export async function login(username, password) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.LOGIN, { username, password });

    // Store token and user info
    setToken(data.accessToken);
    currentUser = {
      id: data.userId,
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
    };

    return currentUser;
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

/**
 * Register a new user
 */
export async function register(username, password, name, phone, email, addressObj) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.REGISTER, {
      username,
      password,
      name,
      email,
      phone,
      address: addressObj?.street,
      city: addressObj?.city,
      state: addressObj?.state,
      zipCode: addressObj?.postalCode,
      country: addressObj?.country,
    });

    // Store token and user info
    setToken(data.accessToken);
    currentUser = {
      id: data.userId,
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
    };

    return currentUser;
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

/**
 * External OAuth login (Google, Apple)
 */
export async function externalLogin(provider, idToken, email, name, pictureUrl) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.EXTERNAL_LOGIN, {
      provider: provider, // 'Google' or 'Apple'
      idToken: idToken,
      email: email,
      name: name,
      pictureUrl: pictureUrl
    });

    // Store token and user info
    setToken(data.accessToken);
    currentUser = {
      id: data.userId,
      username: data.username,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      externalProvider: data.externalProvider,
      externalProviderId: data.externalProviderId,
    };

    return currentUser;
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

/**
 * Logout the current user
 */
export async function logout() {
  currentUser = null;
  clearAuth();
  return true;
}

/**
 * Get current user from memory or localStorage
 */
export function getCurrent() {
  if (currentUser) {
    return currentUser;
  }

  // Try to restore from localStorage if token exists
  const token = getToken();
  if (token) {
    // Token exists but user info is lost, would need to call /auth/me to restore
    // For now, return null to trigger re-login
    return null;
  }

  return null;
}

/**
 * Get current user profile from backend
 */
export async function getCurrentProfile() {
  try {
    const data = await get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return data;
  } catch (error) {
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId) {
  try {
    const data = await get(API_ENDPOINTS.AUTH.GET_USER(userId));
    return data;
  } catch (error) {
    throw new Error('Failed to fetch user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, profileData) {
  try {
    const data = await put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);

    // Update local current user
    if (currentUser && currentUser.id === userId) {
      currentUser = { ...currentUser, ...data };
    }

    return data;
  } catch (error) {
    throw new Error('Failed to update user profile');
  }
}

/**
 * Send phone verification code via SMS/Viber
 */
export async function sendPhoneVerification(phoneNumber, method = 'Viber') {
  try {
    const data = await post(API_ENDPOINTS.AUTH.PHONE_SEND_VERIFICATION, { 
      phoneNumber, 
      method 
    });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to send verification code');
  }
}

/**
 * Verify phone with 4-digit code
 */
export async function verifyPhoneCode(token, code) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.PHONE_VERIFY_CODE, { 
      token, 
      code 
    });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to verify code');
  }
}

/**
 * Resend phone verification code
 */
export async function resendPhoneVerification(token) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.PHONE_RESEND, { token });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to resend verification code');
  }
}

/**
 * Get phone verification status
 */
export async function getPhoneVerificationStatus(token) {
  try {
    const data = await get(API_ENDPOINTS.AUTH.PHONE_STATUS(token));
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to get verification status');
  }
}

/**
 * Verify authentication token with backend
 */
export async function verifyToken() {
  try {
    const data = await get(API_ENDPOINTS.AUTH.VERIFY_TOKEN);
    return data;
  } catch (error) {
    // Token is invalid or expired
    currentUser = null;
    clearAuth();
    throw error;
  }
}

/**
 * Handle unauthorized access
 */
export function handleUnauthorized(ex) {
  return {
    error: true,
    status: 401,
    message: ex?.message || ex?.Message || "Unauthorized"
  };
}

