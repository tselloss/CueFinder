import { API_ENDPOINTS } from '../../config/apiConfig';
import { get, put, delete_ } from '../../utils/httpClient';

export async function getAllUsers() {
  return await get(API_ENDPOINTS.ADMIN.USERS);
}

export async function updateUser(id, data) {
  return await put(API_ENDPOINTS.ADMIN.USER(id), data);
}

export async function deleteUser(id) {
  return await delete_(API_ENDPOINTS.ADMIN.USER(id));
}
