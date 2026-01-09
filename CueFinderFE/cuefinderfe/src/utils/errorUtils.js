/**
 * Error Handling Utilities
 * Helper functions for formatting and displaying error messages
 */

/**
 * Extract a user-friendly error message from an error object
 * Supports RFC 7807 Problem Details format and other common error formats
 * 
 * @param {Error|Object} error - The error object from API call
 * @param {string} fallbackMessage - Default message if no error details found
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, fallbackMessage = 'An error occurred') {
  if (!error) return fallbackMessage;

  // Direct error message
  if (typeof error === 'string') return error;

  // Error object with message property
  if (error.message) return error.message;

  // Problem Details format (RFC 7807)
  if (error.problemDetails) {
    const pd = error.problemDetails;
    
    // Use detail if available (most specific)
    if (pd.detail) return pd.detail;
    
    // Otherwise use title
    if (pd.title) return pd.title;
  }

  // Check error.data for nested error information
  if (error.data) {
    if (error.data.detail) return error.data.detail;
    if (error.data.title) return error.data.title;
    if (error.data.message) return error.data.message;
    if (error.data.error) return error.data.error;
  }

  // HTTP status-based fallback
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Request failed with status ${error.status}`;
    }
  }

  return fallbackMessage;
}

/**
 * Extract validation errors from Problem Details
 * 
 * @param {Error|Object} error - The error object from API call
 * @returns {Object} Object mapping field names to error messages
 */
export function getValidationErrors(error) {
  if (!error) return {};

  // Check for errors in Problem Details format
  if (error.problemDetails?.errors) {
    return error.problemDetails.errors;
  }

  // Check for errors in data
  if (error.data?.errors) {
    return error.data.errors;
  }

  return {};
}

/**
 * Format validation errors as a readable string
 * 
 * @param {Error|Object} error - The error object from API call
 * @returns {string} Formatted validation errors or empty string
 */
export function formatValidationErrors(error) {
  const errors = getValidationErrors(error);
  
  if (Object.keys(errors).length === 0) return '';

  const messages = [];
  
  for (const [field, fieldErrors] of Object.entries(errors)) {
    if (Array.isArray(fieldErrors)) {
      fieldErrors.forEach(msg => messages.push(`${field}: ${msg}`));
    } else if (typeof fieldErrors === 'string') {
      messages.push(`${field}: ${fieldErrors}`);
    }
  }

  return messages.join('\n');
}

/**
 * Check if error is a specific HTTP status code
 * 
 * @param {Error|Object} error - The error object
 * @param {number} statusCode - HTTP status code to check
 * @returns {boolean} True if error matches the status code
 */
export function isErrorStatus(error, statusCode) {
  return error?.status === statusCode;
}

/**
 * Check if error is a validation error (400 or 422)
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if error is a validation error
 */
export function isValidationError(error) {
  return isErrorStatus(error, 400) || isErrorStatus(error, 422);
}

/**
 * Check if error is an authentication error (401)
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if error is an authentication error
 */
export function isAuthError(error) {
  return isErrorStatus(error, 401);
}

/**
 * Check if error is a permission error (403)
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if error is a permission error
 */
export function isPermissionError(error) {
  return isErrorStatus(error, 403);
}

/**
 * Check if error is a not found error (404)
 * 
 * @param {Error|Object} error - The error object
 * @returns {boolean} True if error is a not found error
 */
export function isNotFoundError(error) {
  return isErrorStatus(error, 404);
}

/**
 * Get a complete error display message including validation errors
 * 
 * @param {Error|Object} error - The error object
 * @param {string} fallbackMessage - Default message if no error details found
 * @returns {string} Complete formatted error message
 */
export function getCompleteErrorMessage(error, fallbackMessage = 'An error occurred') {
  const mainMessage = getErrorMessage(error, fallbackMessage);
  const validationErrors = formatValidationErrors(error);
  
  if (validationErrors) {
    return `${mainMessage}\n\n${validationErrors}`;
  }
  
  return mainMessage;
}
