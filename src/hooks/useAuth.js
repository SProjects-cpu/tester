import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication on mount
  const checkAuth = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
      api.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.login(username, password);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setError(null);
  }, []);

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  // Check if user is guest
  const isGuest = useCallback(() => {
    return user?.role === 'guest';
  }, [user]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin,
    isGuest
  };
}
