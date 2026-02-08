import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = authService.getCurrent();
        if (currentUser) {
          setUser(currentUser);
        } else {
          const token = authService.getToken();
          if (token) {
            const userData = await authService.getCurrentProfile();
            setUser({
              id: userData.id,
              username: userData.username,
              name: userData.name,
              email: userData.email,
              phone: userData.phone,
              hidePhone: userData.hidePhone,
              role: userData.role
            });
          }
        }
      } catch (error) {
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

  const register = async (username, password, name, phone, email, addressObj, acceptedTerms = false, wantsClubOwner = false) => {
    const u = await authService.register(username, password, name, phone, email, addressObj, acceptedTerms, wantsClubOwner);
    setUser(u);
    return u;
  };

  const sendSms = async (phoneNumber, method = 'SMS') => {
    return authService.sendPhoneVerification(phoneNumber, method);
  };

  const verifySms = async (verificationToken, code) => {
    return authService.verifyPhoneCode(verificationToken, code);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendSms, verifySms, logout }}>
      {loading ? <div className="card">Loading...</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
