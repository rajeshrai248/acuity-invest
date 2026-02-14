import { useState, useCallback } from 'react';
import type { UserPublic, LoginCredentials, RegisterCredentials } from '../types';
import { loginUser, registerUser, logoutUser } from '../services/api';

function getStoredUser(): UserPublic | null {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasStoredToken(): boolean {
  return !!localStorage.getItem('auth_token');
}

export function useAuth() {
  const [user, setUser] = useState<UserPublic | null>(getStoredUser);
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await loginUser(credentials);
      setUser(user);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Login failed');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await registerUser(credentials);
      setUser(user);
      setIsAuthenticated(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Registration failed');
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
  };
}
