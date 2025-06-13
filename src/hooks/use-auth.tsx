import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextProps {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('vf_token');
    if (stored) {
      setToken(stored);
    }
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('vf_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('vf_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
