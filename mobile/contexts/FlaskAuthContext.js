import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService } from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data, error } = await apiService.getSession();
      if (data && data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, phone, fullName) => {
    try {
      const userData = {
        email,
        password,
        phone,
        full_name: fullName,
      };

      const { data, error } = await apiService.register(userData);
      
      if (error) {
        return { data: null, error: new Error(error) };
      }

      // On successful registration, the user might need to verify email
      // or might be automatically logged in depending on your backend logic
      if (data.user) {
        setUser(data.user);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const credentials = { email, password };
      const { data, error } = await apiService.login(credentials);

      if (error) {
        return { data: null, error: new Error(error) };
      }

      if (data.user) {
        setUser(data.user);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  };

  const signInWithPhone = async (phone, password) => {
    try {
      const credentials = { phone, password };
      const { data, error } = await apiService.login(credentials);

      if (error) {
        return { data: null, error: new Error(error) };
      }

      if (data.user) {
        setUser(data.user);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Phone login error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await apiService.logout();
      setUser(null);
      return { error };
    } catch (error) {
      console.error('Logout error:', error);
      return { error };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signInWithEmail,
    signInWithPhone,
    signOut,
    checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};