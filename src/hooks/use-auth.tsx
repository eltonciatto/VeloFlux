import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface UserInfo {
  user_id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
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

  const fetchProfile = async (tok: string) => {
    try {
      const profile = await apiFetch('/api/profile', {
        headers: { Authorization: `Bearer ${tok}` },
      });
      localStorage.setItem('vf_user', JSON.stringify(profile));
      setUser(profile as UserInfo);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('vf_token');
    const storedUser = localStorage.getItem('vf_user');
    if (stored) {
      setToken(stored);
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          fetchProfile(stored);
        }
      } else {
        fetchProfile(stored);
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { token: newToken } = res as { token: string };
    localStorage.setItem('vf_token', newToken);
    setToken(newToken);
    await fetchProfile(newToken);
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
