import { get, post, setToken, getToken, clearAuth } from '../utils/httpClient';

const defaultAuthBaseUrl = (() => {
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }
  return 'https://billiardscuefinder.com/api';
})();

const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_API_BASE_URL || '').trim() || defaultAuthBaseUrl;

let currentUser = null;

export { getToken, clearAuth };

export async function login(username, password) {
  const data = await post(`${AUTH_BASE_URL}/auth/login`, { username, password });
  setToken(data.accessToken);
  currentUser = mapUser(data);
  return currentUser;
}

export async function register(username, password, name, phone, email, acceptedTerms = false, wantsClubOwner = false) {
  const data = await post(`${AUTH_BASE_URL}/auth/register`, {
    username,
    password,
    name,
    email,
    phone,
    acceptedTerms,
    wantsClubOwner
  });
  setToken(data.accessToken);
  currentUser = mapUser(data);
  return currentUser;
}

export async function getCurrentProfile() {
  return get(`${AUTH_BASE_URL}/auth/me`);
}

export async function logout() {
  currentUser = null;
  clearAuth();
  return true;
}

export function getCurrent() {
  if (currentUser) return currentUser;
  const token = getToken();
  return token ? null : null;
}

const mapUser = (data) => ({
  id: data.userId,
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
  country: data.country
});
