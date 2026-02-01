/**
 * Data Helper Functions for E2E Tests
 * 
 * Provides functions for creating test data and API operations
 */

const { API_BASE_URL } = require('./authHelper');

/**
 * Create a new listing/item
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {Object} itemData - Item data
 * @returns {Promise<Object>} Response with item ID
 */
async function createListing(request, token, itemData) {
  const response = await request.post(`${API_BASE_URL}/cues`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: itemData
  });
  
  if (!response.ok()) {
    console.error('Failed to create listing:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Get all listings
 * @param {Object} request - Playwright request context
 * @returns {Promise<Array>} Array of listings
 */
async function getListings(request) {
  const response = await request.get(`${API_BASE_URL}/cues`);
  
  if (!response.ok()) {
    console.error('Failed to get listings:', response.status());
    return [];
  }
  
  return await response.json().catch(() => []);
}

/**
 * Get listing by ID
 * @param {Object} request - Playwright request context
 * @param {string} id - Listing ID
 * @returns {Promise<Object>} Listing data
 */
async function getListing(request, id) {
  const response = await request.get(`${API_BASE_URL}/cues/${id}`);
  
  if (!response.ok()) {
    console.error('Failed to get listing:', response.status());
    return null;
  }
  
  return await response.json().catch(() => null);
}

/**
 * Update listing
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {string} id - Listing ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response
 */
async function updateListing(request, token, id, updateData) {
  const response = await request.put(`${API_BASE_URL}/cues/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: updateData
  });
  
  if (!response.ok()) {
    console.error('Failed to update listing:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Delete listing
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {string} id - Listing ID
 * @returns {Promise<Object>} Response
 */
async function deleteListing(request, token, id) {
  const response = await request.delete(`${API_BASE_URL}/cues/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok()) {
    console.error('Failed to delete listing:', response.status());
  }
  
  return {
    status: response.status()
  };
}

/**
 * Get user profile
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @returns {Promise<Object>} User profile data
 */
async function getUserProfile(request, token) {
  const response = await request.get(`${API_BASE_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok()) {
    console.error('Failed to get profile:', response.status());
    return null;
  }
  
  return await response.json().catch(() => null);
}

/**
 * Update user profile
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Response
 */
async function updateUserProfile(request, token, profileData) {
  const response = await request.put(`${API_BASE_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: profileData
  });
  
  if (!response.ok()) {
    console.error('Failed to update profile:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Generate sample listing data
 * @param {string} itemType - Type of item (cue, table, etc.)
 * @returns {Object} Sample listing object
 */
function generateSampleListing(itemType = 'cue') {
  const timestamp = Date.now();
  
  if (itemType === 'cue') {
    return {
      title: `Premium Cue Stick ${timestamp}`,
      brand: 'Predator',
      description: 'Professional grade cue stick in excellent condition',
      price: '350',
      condition: 'Good',
      location: 'Chicago, IL',
      category: 'Cues'
    };
  }
  
  if (itemType === 'table') {
    return {
      title: `Billiard Table ${timestamp}`,
      brand: 'Brunswick',
      description: 'Professional 8ft pool table with slate bed',
      price: '2500',
      condition: 'Good',
      location: 'Chicago, IL',
      category: 'Tables'
    };
  }
  
  if (itemType === 'accessories') {
    return {
      title: `Pool Balls Set ${timestamp}`,
      brand: 'Aramith',
      description: 'Complete set of professional pool balls',
      price: '120',
      condition: 'Good',
      location: 'Chicago, IL',
      category: 'Accessories'
    };
  }
  
  return {
    title: `Item ${timestamp}`,
    description: 'Test item',
    price: '100',
    condition: 'Good',
    location: 'Chicago, IL'
  };
}

/**
 * Generate sample profile data
 * @returns {Object} Sample profile update
 */
function generateSampleProfileUpdate() {
  return {
    name: `Updated Name ${Date.now()}`,
    bio: 'Updated bio for testing',
    location: 'New York, NY',
    phone: '+16175551234'
  };
}

/**
 * Create forum discussion via API
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {Object} discussionData - Discussion data
 * @returns {Promise<Object>} Response with discussion ID
 */
async function createForumDiscussion(request, token, discussionData) {
  const response = await request.post(`${API_BASE_URL}/forum/discussions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: discussionData
  });
  
  if (!response.ok()) {
    console.error('Failed to create discussion:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Create forum post/reply via API
 * @param {Object} request - Playwright request context
 * @param {string} token - Authorization token
 * @param {Object} postData - Post data (content, discussionId, replyToPostId)
 * @returns {Promise<Object>} Response
 */
async function createForumPost(request, token, postData) {
  const response = await request.post(`${API_BASE_URL}/forum/posts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    },
    data: postData
  });
  
  if (!response.ok()) {
    console.error('Failed to create post:', response.status(), await response.text());
  }
  
  return {
    status: response.status(),
    data: await response.json().catch(() => ({}))
  };
}

/**
 * Get forum categories
 * @param {Object} request - Playwright request context
 * @returns {Promise<Array>} Array of categories
 */
async function getForumCategories(request) {
  const response = await request.get(`${API_BASE_URL}/forum/categories`);
  
  if (!response.ok()) {
    console.error('Failed to get categories:', response.status());
    return [];
  }
  
  return await response.json().catch(() => []);
}

/**
 * Get forum discussions for category
 * @param {Object} request - Playwright request context
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of discussions
 */
async function getCategoryDiscussions(request, categoryId) {
  const response = await request.get(`${API_BASE_URL}/forum/categories/${categoryId}/discussions`);
  
  if (!response.ok()) {
    console.error('Failed to get discussions:', response.status());
    return [];
  }
  
  return await response.json().catch(() => []);
}

/**
 * Get discussion posts
 * @param {Object} request - Playwright request context
 * @param {string} discussionId - Discussion ID
 * @returns {Promise<Array>} Array of posts
 */
async function getDiscussionPosts(request, discussionId) {
  const response = await request.get(`${API_BASE_URL}/forum/discussions/${discussionId}/posts`);
  
  if (!response.ok()) {
    console.error('Failed to get posts:', response.status());
    return [];
  }
  
  return await response.json().catch(() => []);
}

/**
 * Generate sample forum discussion
 * @returns {Object} Sample discussion data
 */
function generateSampleDiscussion() {
  const timestamp = Date.now();
  return {
    title: `Test Discussion ${timestamp}`,
    content: `This is a test discussion created at ${new Date().toISOString()}. Testing forum functionality.`,
    categoryId: null // Will be set before creation
  };
}

/**
 * Generate sample forum post
 * @returns {Object} Sample post data
 */
function generateSamplePost() {
  const timestamp = Date.now();
  return {
    content: `Test post created at ${new Date().toISOString()}. This is a reply to test forum functionality.`,
    discussionId: null, // Will be set before creation
    replyToPostId: null // Optional: for nested replies
  };
}

module.exports = {
  createListing,
  getListings,
  getListing,
  updateListing,
  deleteListing,
  getUserProfile,
  updateUserProfile,
  generateSampleListing,
  generateSampleProfileUpdate,
  createForumDiscussion,
  createForumPost,
  getForumCategories,
  getCategoryDiscussions,
  getDiscussionPosts,
  generateSampleDiscussion,
  generateSamplePost
};
