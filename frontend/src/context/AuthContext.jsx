import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('campushire_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('campushire_token');
      if (storedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          setToken(storedToken);
        } catch (err) {
          console.warn('Failed to restore user session:', err);
          localStorage.removeItem('campushire_token');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('campushire_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (registrationData) => {
    const createdUser = await authApi.register(registrationData);
    // Automatically log the user in after registration
    try {
      const loginData = await authApi.login(registrationData.email, registrationData.password);
      localStorage.setItem('campushire_token', loginData.access_token);
      setToken(loginData.access_token);
      setUser(loginData.user);
      return loginData.user;
    } catch (loginErr) {
      console.warn('Auto-login encountered issue after registration:', loginErr);
      return createdUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('campushire_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
