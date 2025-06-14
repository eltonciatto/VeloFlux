import React, { useState, useEffect, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { TokenService } from '@/lib/tokenService';
import { AuthContext, UserInfo } from './auth-context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(TokenService.getToken());
  const [user, setUser] = useState<UserInfo | null>(TokenService.getUserInfo());
  const [loginAttempts, setLoginAttempts] = useState<Record<string, number>>({});
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Record<string, number>>({});

  const fetchProfile = useCallback(async (tok: string) => {
    try {
      const profile = await safeApiFetch('/api/profile', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      TokenService.setUserInfo(profile);
      setUser(profile as UserInfo);
    } catch {
      logout();
    }
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      if (!token) return false;
      
      const res = await safeApiFetch('/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const { token: newToken } = res as { token: string };
      TokenService.setToken(newToken);
      setToken(newToken);
      return true;
    } catch (error) {
      console.error('Failed to refresh token', error);
      return false;
    }
  }, [token]);

  useEffect(() => {
    const storedToken = TokenService.getToken();
    const storedUser = TokenService.getUserInfo();
    
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        try {
          setUser(storedUser);
        } catch {
          fetchProfile(storedToken);
        }
      } else {
        fetchProfile(storedToken);
      }
    }
    
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      if (storedToken) {
        refreshToken();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes
    
    return () => clearInterval(refreshInterval);
  }, [fetchProfile, refreshToken]);

  const login = async (email: string, password: string) => {
    // Implement login throttling
    const now = Date.now();
    const recentAttempts = loginAttempts[email] || 0;
    const lastAttempt = lastLoginAttempt[email] || 0;
    
    // If too many recent attempts, block temporarily
    if (recentAttempts >= 5 && now - lastAttempt < 15 * 60 * 1000) { // 15 minutes lockout
      throw new Error('Too many login attempts. Please try again later.');
    }
    
    try {
      const res = await safeApiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const { token: newToken } = res as { token: string };
      
      // Reset login attempts on success
      setLoginAttempts(prev => ({
        ...prev,
        [email]: 0
      }));
      
      TokenService.setToken(newToken);
      setToken(newToken);
      await fetchProfile(newToken);
    } catch (error) {
      // Increment failed login attempts
      setLoginAttempts(prev => ({
        ...prev,
        [email]: (prev[email] || 0) + 1
      }));
      
      setLastLoginAttempt(prev => ({
        ...prev,
        [email]: now
      }));
      
      throw error;
    }
  };

  const updateProfile = async (first: string, last: string) => {
    const updated = await safeApiFetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ first_name: first, last_name: last }),
    });
    TokenService.setUserInfo(updated);
    setUser(updated as UserInfo);
  };

  const logout = () => {
    TokenService.clearAll();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateProfile, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
