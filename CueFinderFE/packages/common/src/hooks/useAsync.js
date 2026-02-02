import { useEffect, useState, useCallback } from 'react';

/**
 * useAsync Hook
 * Manages async function execution with loading, data, and error states
 * 
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount (default: true)
 * @returns {Object} { status, data, error, execute, reset }
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (err) {
      setError(err);
      setStatus('error');
      throw err;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { 
    status,
    data, 
    error,
    execute,
    reset,
    isLoading: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
}
