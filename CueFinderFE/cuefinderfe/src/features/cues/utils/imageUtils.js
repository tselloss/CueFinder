import { API_BASE_URL, SITE_BASE_URL } from '../../../config/apiConfig';

/**
 * Get full image URL from image object or string
 * Handles data URIs, absolute URLs, and relative URLs
 * @param {Array|string} images - Image object array or URL string
 * @returns {string} Full image URL or empty string
 */
export const getImageUrl = (images) => {
  if (!images || images.length === 0) return '';

  // Find primary image first, otherwise use first image
  const primaryImg = images.find((img) => {
    if (typeof img === 'object') return img.isPrimary;
    return false;
  });

  const img = primaryImg || images[0];

  // Handle both string URLs and image objects
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';

  // If data URI (base64) or absolute URL, use as-is
  if (url.startsWith('data:') || url.startsWith('http')) return url;

  // Uploaded files are served at /uploads/* on the public site (proxied to backend)
  if (url.startsWith('/uploads/')) return `${SITE_BASE_URL}${url}`;

  // If relative URL, prepend API base
  return `${API_BASE_URL}${url}`;
};
