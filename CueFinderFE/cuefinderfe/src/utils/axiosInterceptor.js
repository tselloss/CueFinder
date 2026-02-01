import axios from 'axios';
import { getErrorMessage } from './errorUtils';

let toastHandler = null;

/**
 * Initialize axios interceptor for error handling
 * @param {Function} showErrorToast - Function to show error toast notifications
 */
export function initializeAxiosInterceptor(showErrorToast) {
  toastHandler = showErrorToast;

  // Response interceptor to handle errors
  axios.interceptors.response.use(
    (response) => {
      // Return successful responses as-is
      return response;
    },
    (error) => {
      // Only show toast for actual HTTP errors (not network errors handled elsewhere)
      if (error.response && toastHandler) {
        const errorMessage = getErrorMessage(error.response, 'An error occurred');
        
        // Don't show toast for authentication errors (401) as these are usually handled by redirects
        if (error.response.status !== 401) {
          toastHandler(errorMessage);
        }
      } else if (error.request && toastHandler && !error.response) {
        // Network error (no response received)
        toastHandler('Network error. Please check your connection and try again.');
      }

      // Always reject the promise so the calling code can handle it if needed
      return Promise.reject(error);
    }
  );
}

/**
 * Update the toast handler (useful if the component re-renders)
 * @param {Function} showErrorToast - Function to show error toast notifications
 */
export function updateToastHandler(showErrorToast) {
  toastHandler = showErrorToast;
}
