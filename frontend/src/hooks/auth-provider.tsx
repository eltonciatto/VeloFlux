import React, { useState, useEffect, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { TokenService } from '@/lib/tokenService';
import { AuthContext, UserInfo } from './auth-context';
import type { UserInfo as TokenUserInfo } from '@/lib/tokenService';
import { CONFIG, isDemoMode, isProduction } from '@/config/environment';

// Helper function to convert TokenService UserInfo to AuthContext UserInfo
const convertTokenUserToAuthUser = (tokenUser: TokenUserInfo): UserInfo => {
  return {
    user_id: tokenUser.id,
    tenant_id: tokenUser.tenantId || 'default',
    email: tokenUser.email,
    first_name: tokenUser.name?.split(' ')[0],
    last_name: tokenUser.name?.split(' ').slice(1).join(' '),
    role: tokenUser.role
  };
};

// Helper function to convert AuthContext UserInfo to TokenService UserInfo
const convertAuthUserToTokenUser = (authUser: UserInfo): TokenUserInfo => {
  return {
    id: authUser.user_id,
    email: authUser.email,
    name: `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim(),
    role: authUser.role,
    tenantId: authUser.tenant_id
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(TokenService.getToken());
  const [user, setUser] = useState<UserInfo | null>(() => {
    const tokenUser = TokenService.getUserInfo();
    return tokenUser ? convertTokenUserToAuthUser(tokenUser) : null;
  });
  const [loginAttempts, setLoginAttempts] = useState<Record<string, number>>({});
  const [lastLoginAttempt, setLastLoginAttempt] = useState<Record<string, number>>({});  const fetchProfile = useCallback(async (tok: string) => {
    try {
      const profile = await safeApiFetch('/profile', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const authUser = profile as UserInfo; // API returns AuthContext UserInfo format
      const tokenUser = convertAuthUserToTokenUser(authUser);
      TokenService.setUserInfo(tokenUser);
      setUser(authUser);
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
          const authUser = convertTokenUserToAuthUser(storedUser);
          setUser(authUser);
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
  }, [fetchProfile, refreshToken]);const login = async (email: string, password: string) => {
    // Demo mode: Only use demo credentials in development/demo mode
    if (isDemoMode() && 
        (email === CONFIG.DEMO_CREDENTIALS.username || email === 'demo') && 
        password === CONFIG.DEMO_CREDENTIALS.password) {
      
      console.warn('🔧 Demo Mode: Using simulated authentication. This will not work in production!');
      
      // Create a demo token and user
      const demoToken = 'demo-token-' + Date.now();
      const demoUser: UserInfo = {
        user_id: 'demo-user',
        tenant_id: 'default',
        email: 'admin@veloflux.demo',
        first_name: 'Admin',
        last_name: 'Demo',
        role: 'admin'
      };
      
      const tokenUser: TokenUserInfo = {
        id: 'demo-user',
        email: 'admin@veloflux.demo',
        name: 'Admin Demo',
        role: 'admin',
        tenantId: 'default'
      };
      
      TokenService.setToken(demoToken);
      TokenService.setUserInfo(tokenUser);
      setToken(demoToken);
      setUser(demoUser);
      return;
    }

    // Production mode: Block demo credentials
    if (isProduction() && 
        (email === CONFIG.DEMO_CREDENTIALS.username || email === 'demo') && 
        password === CONFIG.DEMO_CREDENTIALS.password) {
      throw new Error('Demo credentials are not allowed in production. Please use real credentials.');
    }

    // Implement login throttling for real authentication
    const now = Date.now();
    const recentAttempts = loginAttempts[email] || 0;
    const lastAttempt = lastLoginAttempt[email] || 0;
    
    // If too many recent attempts, block temporarily
    if (recentAttempts >= 5 && now - lastAttempt < 15 * 60 * 1000) { // 15 minutes lockout
      throw new Error('Too many login attempts. Please try again later.');
    }
    
    try {
      // Use real authentication endpoint
      const authEndpoint = isProduction() 
        ? CONFIG.PRODUCTION.ENDPOINTS.LOGIN 
        : '/auth/login';
          const res = await safeApiFetch(authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password
          // Removed production-specific fields - backend expects only email/password
        }),
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
      
      // Add production-specific error handling
      if (isProduction()) {
        console.error('Production authentication failed:', error);
      }
      
      throw error;
    }
  };  const updateProfile = async (first: string, last: string) => {
    const updated = await safeApiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify({ first_name: first, last_name: last }),
    });
    const authUser = updated as UserInfo; // API returns AuthContext UserInfo format
    const tokenUser = convertAuthUserToTokenUser(authUser);
    TokenService.setUserInfo(tokenUser);
    setUser(authUser);
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
