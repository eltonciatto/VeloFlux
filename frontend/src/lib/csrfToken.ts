// CSRF Protection Utility
import { useEffect, useState } from 'react';
import { apiFetch } from './api';

// Generate a random token
const generateCSRFToken = (): string => {
  return Array(32)
    .fill(0)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
};

// Store the token in a cookie with HttpOnly flag
const storeCSRFToken = (token: string) => {
  // For development environment, we use localStorage as a fallback
  // In production, this should be set as HttpOnly cookie by the server
  localStorage.setItem('vf_csrf_token', token);
};

// Hook to use CSRF token
export const useCSRFToken = () => {
  const [csrfToken, setCSRFToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to get token from localStorage (in production, from cookie)
    let token = localStorage.getItem('vf_csrf_token');
    
    // If no token exists, generate a new one
    if (!token) {
      token = generateCSRFToken();
      storeCSRFToken(token);
    }
    
    setCSRFToken(token);
  }, []);

  return csrfToken;
};

// Function to add CSRF token to requests
export const addCSRFToken = (options: RequestInit = {}): RequestInit => {
  const csrfToken = localStorage.getItem('vf_csrf_token');
  if (!csrfToken) {
    return options;
  }
  
  const headers = {
    ...options.headers,
    'X-CSRF-Token': csrfToken,
  };
  
  return {
    ...options,
    headers,
  };
};

// Update apiFetch to automatically include the CSRF token
export const safeApiFetch = async (path: string, options: RequestInit = {}) => {
  const safeOptions = addCSRFToken(options);
  return apiFetch(path, safeOptions);
};
