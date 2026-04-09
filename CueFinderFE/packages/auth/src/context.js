import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@cuefinder/api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children, loadingFallback = null }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const currentUser = authService.getCurrent();
        if (currentUser) {
          if (isMounted) {
            setUser(currentUser);
          }
          return;
        }

        const token = authService.getToken();
        if (!token) {
          return;
        }

        const userData = await authService.getCurrentProfile();
        if (isMounted) {
          setUser(userData);
        }
      } catch (error) {
        authService.clearAuth();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (username, password) => {
    const nextUser = await authService.login(username, password);
    setUser(nextUser);
    return nextUser;
  };

  const register = async (username, password, name, phone, email, addressObj, acceptedTerms = false) => {
    const nextUser = await authService.register(
      username,
      password,
      name,
      phone,
      email,
      addressObj,
      acceptedTerms
    );
    setUser(nextUser);
    return nextUser;
  };

  const externalLogin = async (provider, idToken, email, name, pictureUrl) => {
    const nextUser = await authService.externalLogin(provider, idToken, email, name, pictureUrl);
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (profileData) => {
    if (!user?.id) {
      throw new Error('Cannot update a user before authentication is restored.');
    }

    const updatedUser = await authService.updateUserProfile(user.id, profileData);
    setUser((currentUser) => ({ ...currentUser, ...updatedUser }));
    return updatedUser;
  };

  const contextValue = {
    user,
    loading,
    login,
    register,
    externalLogin,
    logout,
    updateUser,
    sendSms: authService.sendPhoneVerification,
    verifySms: authService.verifyPhoneCode,
    resendVerification: authService.resendPhoneVerification,
    getVerificationStatus: authService.getPhoneVerificationStatus,
  };

  if (loading) {
    return loadingFallback;
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export { AuthContext };