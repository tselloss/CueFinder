import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore user session on mount
    const restoreSession = async () => {
      try {
        const currentUser = authService.getCurrent();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Check if token exists and try to restore user from backend
          const token = authService.getToken();
          if (token) {
            const userData = await authService.getCurrentProfile();
            setUser({
              id: userData.id,
              username: userData.username,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              role: userData.role,
              address: userData.address,
              city: userData.city,
              state: userData.state,
              zipCode: userData.zipCode,
              country: userData.country,
            });
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Token might be expired, clear it
        authService.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
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

  const externalLogin = async (provider, idToken, email, name, pictureUrl) => {
    const u = await authService.externalLogin(provider, idToken, email, name, pictureUrl);
    setUser(u);
    return u;
  };

  const sendSms = async (phoneNumber, method = 'SMS') => {
    return authService.sendPhoneVerification(phoneNumber, method);
  };

  const verifySms = async (verificationToken, code) => {
    return authService.verifyPhoneCode(verificationToken, code);
  };

  const resendVerification = async (token) => {
    return authService.resendPhoneVerification(token);
  };

  const getVerificationStatus = async (token) => {
    return authService.getPhoneVerificationStatus(token);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (profileData) => {
    try {
      // Call API to persist the changes to backend first
      const updatedProfile = await authService.updateUserProfile(user.id, profileData);
      
      // Update user in context with the response from backend
      const updatedUser = { 
        ...user, 
        name: updatedProfile.name || profileData.name,
        email: updatedProfile.email || profileData.email,
        phone: updatedProfile.phone || profileData.phone,
        location: updatedProfile.location || profileData.location,
        address: updatedProfile.address || profileData.address,
        city: updatedProfile.city || profileData.city,
        state: updatedProfile.state || profileData.state,
        zipCode: updatedProfile.zipCode || profileData.zipCode,
        country: updatedProfile.country || profileData.country,
      };
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile on backend:', err);
      throw err; // Re-throw to let the UI handle the error
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login,
      externalLogin, 
      logout, 
      register, 
      sendSms, 
      verifySms, 
      resendVerification,
      getVerificationStatus,
      updateUser 
    }}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem'
        }}>
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
