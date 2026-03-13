const detectBookingUrl = () => {
  const env = process.env.REACT_APP_BOOKING_SITE_URL;
  if (env && env.trim()) return env.trim();
  if (typeof window !== 'undefined') {
    const host = window.location?.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
  }
  return 'https://bookbilliard.com';
};

export const BOOKING_SITE_URL = detectBookingUrl();
