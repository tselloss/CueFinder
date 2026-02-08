const defaultCueFinderSiteUrl = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }
  return 'https://billiardscuefinder.com';
})();

const defaultBookingSiteUrl = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  return 'https://bookbilliard.com';
})();

export const CUEFINDER_SITE_URL = (import.meta.env.VITE_CUEFINDER_SITE_URL || '').trim() || defaultCueFinderSiteUrl;
export const BOOKING_SITE_URL = (import.meta.env.VITE_BOOKING_SITE_URL || '').trim() || defaultBookingSiteUrl;
