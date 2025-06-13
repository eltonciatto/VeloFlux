import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface UserInfo {
  user_id: string;
  tenant_id: string;
}

interface AuthContextProps {
  token: string | null;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vf_token');
    const storedUser = localStorage.getItem('vf_user');
    if (stored) {
      setToken(stored);
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // ignore
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { token: newToken, user_id, tenant_id } = res as {
      token: string;
      user_id: string;
      tenant_id: string;
    };
    localStorage.setItem('vf_token', newToken);
    localStorage.setItem('vf_user', JSON.stringify({ user_id, tenant_id }));
    setToken(newToken);
    setUser({ user_id, tenant_id });
  };

  const logout = () => {
    localStorage.removeItem('vf_token');
    localStorage.removeItem('vf_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
