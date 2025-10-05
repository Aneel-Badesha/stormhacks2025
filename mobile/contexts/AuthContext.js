import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { apiService } from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user with Flask backend after Supabase auth
  const syncWithFlask = async (supabaseUser) => {
    if (!supabaseUser) return;
    
    try {
      const { data, error } = await apiService.request('/api/mobile/auth/sync-user', {
        method: 'POST',
        body: JSON.stringify({
          email: supabaseUser.email,
          phone: supabaseUser.phone,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
        }),
      });
      
      if (!error) {
        console.log('User synced with Flask backend:', data);
      }
    } catch (error) {
      console.error('Error syncing with Flask:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        console.log('Session loaded:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          syncWithFlask(session.user);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        syncWithFlask(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, phone, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        phone,
        options: {
          data: {
            full_name: fullName,
            phone_number: phone,
          },
        },
      });
      
      if (error) throw error;

      // Note: User profile will be created automatically by database trigger
      // If you haven't set up the trigger, you'll need to create the profile manually
      // after the user confirms their email

      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithPhone = async (phone, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signInWithEmail,
    signInWithPhone,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
