import { useCallback, useState } from 'react';
import * as authService from '../../../api/authService';

/**
 * useAuthForm Hook
 * Handles authentication form logic (login, register, etc.)
 */
export function useAuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = useCallback(async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(username, password);
      return user;
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (username, password, name, phone, email, address) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.register(username, password, name, phone, email, address);
      return user;
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExternalLogin = useCallback(async (provider, idToken, email, name, pictureUrl) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.externalLogin(provider, idToken, email, name, pictureUrl);
      return user;
    } catch (err) {
      const message = err.message || `${provider} login failed`;
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    handleLogin,
    handleRegister,
    handleExternalLogin,
    clearError
  };
}
