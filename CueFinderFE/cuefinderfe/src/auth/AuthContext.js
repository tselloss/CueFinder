import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrent());

  useEffect(() => {
    setUser(authService.getCurrent());
  }, []);

  const login = async (username, password) => {
    const u = await authService.login(username, password);
    setUser(u);
    return u;
  };

  const register = async (username, password, name, phone, email, addressObj) => {
    const u = await authService.register(username, password, name, phone, email, addressObj);
    setUser(u);
    return u;
  };

  const sendSms = async (phone) => {
    return authService.sendSmsCode(phone);
  };

  const verifySms = async (phone, code) => {
    return authService.verifySmsCode(phone, code);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (profileData) => {
    // Update user in context with new profile data
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    
    // Call API to persist the changes to backend
    try {
      await authService.updateUserProfile(user.id, profileData);
    } catch (err) {
      console.error('Failed to update profile on backend:', err);
      // Still update local state, but log the error
    }
    
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, sendSms, verifySms, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
