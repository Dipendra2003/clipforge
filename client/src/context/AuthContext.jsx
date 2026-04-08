import { useState, useEffect } from 'react';
import { authAPI, getUser, removeToken } from '../utils/auth';
import { AuthContext } from './createAuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      try {
        const storedUser = getUser();
        if (storedUser) {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          setUser(response.user);
        }
      } catch {
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    setUser(response.user);
    return response;
  };

  const signup = async (userData) => {
    const response = await authAPI.signup(userData);
    // Don't set user yet if email verification is required
    return response;
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const logoutAll = async () => {
    await authAPI.logoutAll();
    setUser(null);
  };

  const googleLogin = async (googleToken) => {
    const response = await authAPI.googleAuth(googleToken);
    setUser(response.user);
    return response;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    logoutAll,
    googleLogin,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
