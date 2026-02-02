/**
 * Validation utilities
 */

export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePhoneNumber(phone) {
  // Basic phone validation - adjust as needed
  const regex = /^[\d\s\-\+\(\)]{10,}$/;
  return regex.test((phone || '').replace(/\s/g, ''));
}

export function validatePassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\-]{8,}$/;
  return regex.test(password);
}

export function validateRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
}

export function validateMinLength(value, min) {
  return String(value || '').length >= min;
}

export function validateMaxLength(value, max) {
  return String(value || '').length <= max;
}

export function validateNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export function validateRange(value, min, max) {
  const num = parseFloat(value);
  return num >= min && num <= max;
}
