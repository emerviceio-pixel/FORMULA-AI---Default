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
    // Discard stale cache
    if (Date.now() - (parsed.timestamp || 0) > MAX_CACHE_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

// ──────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const cached = readCachedAuth(); // synchronous — runs before any render

  const [user, setUser]                     = useState(cached?.user          ?? null);
  const [profile, setProfile]               = useState(cached?.profile        ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(cached?.isAuthenticated ?? false);

  // If we have a valid cache we can skip the loading spinner entirely.
  // If there's no cache we must wait for initializeAuth() before routing.
  const [isLoading, setIsLoading]           = useState(!cached);

  const { showSuccess, showError } = useToast();

  // ── Single auth initialization — verifies session with server ─────────────
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = await authService.checkSession();

        if (session.success && session.userId) {
          setUser({ id: session.userId });
          setIsAuthenticated(!!session.isAuthenticated);

          if (session.isAuthenticated) {
            try {
              const userProfile = await authService.getProfile();
              if (userProfile.success) {
                setProfile(userProfile.profile);
              }
            } catch {
              // Profile may not exist yet — that's fine
            }
          }
        } else {
          // Server says no valid session — clear everything
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On network error keep the cached state so the user isn't
        // logged out due to a momentary connectivity issue.
        if (!cached) {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false); // always unblock routing after server check
      }
    };

    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist auth state to localStorage on every change ────────────────────
  useEffect(() => {
    if (user || profile || isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user,
        profile,
        isAuthenticated,
        timestamp: Date.now(),
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, profile, isAuthenticated]);

  // ── Auth actions ───────────────────────────────────────────────────────────
  const googleLogin = async (token) => {
    const result = await authService.googleAuth(token);
    if (result.success) {
      setUser({ id: result.userId });
      setIsAuthenticated(!result.isNewUser);
    }
    return result;
  };

  const verifyPin = async (pin) => {
    try {
      setIsLoading(true);
      const result = await authService.verifyPin(pin);
      if (result.success) {
        setIsAuthenticated(true);
        try {
          const userProfile = await authService.getProfile();
          if (userProfile.success) setProfile(userProfile.profile);
        } catch { /* silent */ }
      }
      return result;
    } catch (error) {
      showError(error.message || 'Invalidd PIN');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  const getPinAttemptStatus = async () => {
    try {
      return await authService.getPinAttemptStatus();
    } catch (error) {
      console.error('Failed to get PIN attempt status:', error);
      return {
        success: false,
        attempts: 0,
        locked: false,
        remainingTime: 0
      };
    }
  };
  const setupPin = async (pin, recoveryWord) => {
    try {
      setIsLoading(true);
      const result = await authService.setupPin(pin, recoveryWord);
      if (result.success) {
        setUser({ id: result.userId });
        setIsAuthenticated(true);
        showSuccess('PIN Created!');
      }
      return result;
    } catch (error) {
      showError(error.message || 'Failed to setup PIN');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPin = async (recoveryWord, newPin) => {
    try {
      setIsLoading(true);
      const result = await authService.resetPin(recoveryWord, newPin);
      if (result.success) showSuccess('PIN reset successful!');
      return result;
    } catch (error) {
      showError(error.message || 'Failed to reset PIN');
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
    googleLogin,
    setupPin,
    verifyPin,
    getPinAttemptStatus,
    resetPin,
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