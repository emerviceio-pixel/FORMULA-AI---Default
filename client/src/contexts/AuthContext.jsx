import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import { useToast } from '../hooks/useToast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'Fomula_auth';
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const readCachedAuth = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed.timestamp || 0) > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const cached = readCachedAuth();

  const [user, setUser] = useState(cached?.user ?? null);
  const [profile, setProfile] = useState(cached?.profile ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(cached?.isAuthenticated ?? false);
  const [isAdmin, setIsAdmin] = useState(cached?.isAdmin ?? false);
  const [isLoading, setIsLoading] = useState(!cached);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.checkSession();
        
        // Handle explicit session expiration
        if (session.sessionExpired) {
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        if (session.success && session.userId) {
          setUser({ id: session.userId });
          setIsAuthenticated(true);
          
          if (session.isAdmin !== undefined) {
            setIsAdmin(session.isAdmin);
          }

          try {
            const userProfile = await authService.getProfile();
            if (userProfile.success) {
              setProfile(userProfile.profile);
              if (userProfile.profile?.isAdmin !== undefined) {
                setIsAdmin(userProfile.profile.isAdmin);
              }
            }
          } catch {
            // Profile may not exist yet
          }
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (!cached) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (user || profile || isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user,
        profile,
        isAuthenticated,
        isAdmin,
        timestamp: Date.now(),
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, profile, isAuthenticated, isAdmin]);

  const googleLogin = async (token) => {
    try {
      setIsLoading(true);
      const result = await authService.googleAuth(token);
      
      if (result.success) {
        setUser({ id: result.userId });
        setIsAuthenticated(true);
        setIsAdmin(result.isAdmin === true);
        
        // Fetch profile data immediately
        try {
          const userProfile = await authService.getProfile();
          if (userProfile.success) {
            setProfile(userProfile.profile);
            if (userProfile.profile?.isAdmin !== undefined) {
              setIsAdmin(userProfile.profile.isAdmin);
            }
          }
        } catch (profileError) {
          console.error('Profile fetch error:', profileError);
          // Don't block login if profile fetch fails
        }
      }
      
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      const result = await authService.updateProfile(profileData);
      if (result.success) setProfile(result.profile);
      return result;
    } catch (error) {
      showError(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (settings) => {
    try {
      setIsLoading(true);
      const result = await authService.updateSettings(settings);
      if (result.success) {
        setProfile(prev => ({ ...prev, settings }));
        showSuccess('Settings updated successfully!');
      }
      return result;
    } catch (error) {
      showError('Failed to update settings: ' + error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const result = await authService.logout();
      if (result.success) {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    } catch (error) {
      showError(error.message || 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    googleLogin,
    updateProfile,
    updateSettings,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};