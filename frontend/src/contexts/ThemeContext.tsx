import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'cyberpunk' | 'midnight' | 'ocean';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const themes: Record<Theme, ThemeColors> = {
  dark: {
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4'
  },
  light: {
    primary: '#2563EB',
    secondary: '#4F46E5',
    accent: '#7C3AED',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0891B2'
  },
  cyberpunk: {
    primary: '#00FFFF',
    secondary: '#FF00FF',
    accent: '#FFFF00',
    background: '#000000',
    surface: '#1A0A1A',
    text: '#00FFFF',
    textSecondary: '#FF00FF',
    border: '#333333',
    success: '#00FF00',
    warning: '#FFAA00',
    error: '#FF0040',
    info: '#00AAFF'
  },
  midnight: {
    primary: '#4C1D95',
    secondary: '#5B21B6',
    accent: '#7C2D12',
    background: '#0C0A1A',
    surface: '#1E1B3A',
    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#065F46',
    warning: '#92400E',
    error: '#991B1B',
    info: '#1E40AF'
  },
  ocean: {
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#0891B2',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F0F9FF',
    textSecondary: '#7DD3FC',
    border: '#0369A1',
    success: '#047857',
    warning: '#CA8A04',
    error: '#DC2626',
    info: '#2563EB'
  }
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('veloflux-theme');
    return (saved as Theme) || 'dark';
  });

  const colors = themes[theme];
  const availableThemes: Theme[] = Object.keys(themes) as Theme[];

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('veloflux-theme', newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    handleSetTheme(availableThemes[nextIndex]);
  };

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, value);
    });
  }, [colors]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme: handleSetTheme,
        toggleTheme,
        availableThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
