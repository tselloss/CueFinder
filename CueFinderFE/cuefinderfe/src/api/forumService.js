import { get, post, put, delete_ } from '../utils/httpClient';
import { API_BASE_URL } from '../config/apiConfig';

const BASE_URL = `${API_BASE_URL}/forum`;

// Categories
export const getCategories = () => get(`${BASE_URL}/categories`);

export const getCategory = (id) => get(`${BASE_URL}/categories/${id}`);

// Discussions
export const getAllDiscussions = () => get(`${BASE_URL}/discussions`);

export const getCategoryDiscussions = (categoryId) =>
  get(`${BASE_URL}/categories/${categoryId}/discussions`);

export const getDiscussion = (id) => get(`${BASE_URL}/discussions/${id}`);

export const createDiscussion = (data) => post(`${BASE_URL}/discussions`, data);

export const updateDiscussion = (id, data) =>
  put(`${BASE_URL}/discussions/${id}`, data);

export const deleteDiscussion = (id) =>
  delete_(`${BASE_URL}/discussions/${id}`);

export const pinDiscussion = (id) =>
  post(`${BASE_URL}/discussions/${id}/pin`);

export const unpinDiscussion = (id) =>
  post(`${BASE_URL}/discussions/${id}/unpin`);

export const lockDiscussion = (id) =>
  post(`${BASE_URL}/discussions/${id}/lock`);

export const unlockDiscussion = (id) =>
  post(`${BASE_URL}/discussions/${id}/unlock`);

// Posts
export const getDiscussionPosts = (discussionId) =>
  get(`${BASE_URL}/discussions/${discussionId}/posts`);

export const getPost = (id) => get(`${BASE_URL}/posts/${id}`);

export const createPost = (data) => post(`${BASE_URL}/posts`, data);

export const updatePost = (id, data) => put(`${BASE_URL}/posts/${id}`, data);

export const deletePost = (id) => delete_(`${BASE_URL}/posts/${id}`);

// Post Interactions
export const likePost = (postId) => post(`${BASE_URL}/posts/${postId}/like`);

export const unlikePost = (postId) =>
  post(`${BASE_URL}/posts/${postId}/unlike`);

export const markPostAsHelpful = (postId) =>
  post(`${BASE_URL}/posts/${postId}/mark-helpful`);

// Search
export const searchDiscussions = (query) =>
  get(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);

// User Stats
export const getUserForumStats = () => get(`${BASE_URL}/user/stats`);

export const getUserDiscussions = (userId) =>
  get(`${BASE_URL}/user/${userId}/discussions`);

export const getUserPosts = (userId) =>
  get(`${BASE_URL}/user/${userId}/posts`);

// Billiard Clubs
export const getClubRecords = () => get(`${BASE_URL}/clubs`);

export const createClubRecord = (data) => post(`${BASE_URL}/clubs`, data);

export const updateClubRecord = (id, data) => put(`${BASE_URL}/clubs/${id}`, data);

export const deleteClubRecord = (id) => delete_(`${BASE_URL}/clubs/${id}`);

export const requestClubCoOwner = (id, emailOrUsername) =>
  post(`${BASE_URL}/clubs/${id}/coowners`, { emailOrUsername });

export const approveClubCoOwner = (id, coOwnerId) =>
  post(`${BASE_URL}/clubs/${id}/coowners/${coOwnerId}/approve`);
