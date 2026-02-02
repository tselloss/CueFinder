/**
 * Format utilities
 */

export function formatPrice(price, currency = '€') {
  const num = parseFloat(price || 0);
  return `${currency}${num.toFixed(2)}`;
}

export function formatDate(date, includeTime = false) {
  if (!date) return '';
  const d = new Date(date);
  const formatted = d.toLocaleDateString();
  if (includeTime) {
    return `${formatted} ${d.toLocaleTimeString()}`;
  }
  return formatted;
}

export function truncate(text, length = 50) {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getImageUrl(images, baseUrl = '') {
  if (!images || images.length === 0) return '';
  const primaryImg = images.find(img => {
    if (typeof img === 'object') return img.isPrimary;
    return false;
  });
  const img = primaryImg || images[0];
  const url = typeof img === 'string' ? img : img.imageUrl;
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http')) return url;
  if (url.startsWith('/uploads/')) return `${baseUrl}${url}`;
  return `${baseUrl}${url}`;
}
