import { API_ENDPOINTS } from '../../config/apiConfig';
import { post, get, put, setToken, getToken, clearAuth } from '../../utils/httpClient';
import {
  AUTH_USER_STORAGE_KEY,
  getStoredValue,
  setStoredValue,
} from '@cuefinder/storage';

export { getToken, clearAuth };

let currentUser = null;

function buildCurrentUser(data) {
  return {
    id: data.userId ?? data.id,
    username: data.username,
    name: data.name,
    email: data.email,
    phone: data.phone,
    hidePhone: data.hidePhone,
    role: data.role,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: data.zipCode,
    country: data.country,
    externalProvider: data.externalProvider,
    externalProviderId: data.externalProviderId,
  };
}

function persistCurrentUser(user) {
  currentUser = user;
  void setStoredValue(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  return currentUser;
}

function restoreStoredUser() {
  const storedUser = getStoredValue(AUTH_USER_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    currentUser = JSON.parse(storedUser);
    return currentUser;
  } catch {
    return null;
  }
}

export async function login(username, password) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
    setToken(data.accessToken);
    return persistCurrentUser(buildCurrentUser(data));
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

export async function register(username, password, name, phone, email, addressObj, acceptedTerms = false) {
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
      acceptedTerms,
    });
    setToken(data.accessToken);
    return persistCurrentUser(buildCurrentUser(data));
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

export async function externalLogin(provider, idToken, email, name, pictureUrl) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.EXTERNAL_LOGIN, {
      provider,
      idToken,
      email,
      name,
      pictureUrl
    });
    setToken(data.accessToken);
    return persistCurrentUser(buildCurrentUser(data));
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

export async function logout() {
  currentUser = null;
  clearAuth();
  return true;
}

export function getCurrent() {
  if (currentUser) {
    return currentUser;
  }
  const storedUser = restoreStoredUser();
  if (storedUser) {
    return storedUser;
  }
  const token = getToken();
  if (token) {
    return null;
  }
  return null;
}

export async function getCurrentProfile() {
  try {
    const data = await get(API_ENDPOINTS.AUTH.CURRENT_USER);
    return persistCurrentUser(buildCurrentUser(data));
  } catch (error) {
    throw new Error('Failed to fetch user profile');
  }
}

export async function getUserProfile(userId) {
  try {
    const data = await get(API_ENDPOINTS.AUTH.GET_USER(userId));
    return data;
  } catch (error) {
    throw new Error('Failed to fetch user profile');
  }
}

export async function updateUserProfile(userId, profileData) {
  try {
    const data = await put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
    if (currentUser && currentUser.id === userId) {
      currentUser = {
        ...currentUser, 
        name: data.name,
        email: data.email,
        phone: data.phone,
        hidePhone: data.hidePhone,
        location: data.location,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
      };
      persistCurrentUser(currentUser);
    }
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update user profile');
  }
}

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

export async function resendPhoneVerification(token) {
  try {
    const data = await post(API_ENDPOINTS.AUTH.PHONE_RESEND, { token });
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to resend verification code');
  }
}

export async function getPhoneVerificationStatus(token) {
  try {
    const data = await get(API_ENDPOINTS.AUTH.PHONE_STATUS(token));
    return data;
  } catch (error) {
    throw new Error(error.message || 'Failed to get verification status');
  }
}

export async function verifyToken() {
  try {
    const data = await get(API_ENDPOINTS.AUTH.VERIFY_TOKEN);
    return data;
  } catch (error) {
    currentUser = null;
    clearAuth();
    throw error;
  }
}

export function handleUnauthorized(ex) {
  return {
    error: true,
    status: 401,
    message: ex?.message || ex?.Message || "Unauthorized"
  };
}
