import { getApiBase, getAdminBase, isProduction } from '@/config/environment';

export const API_BASE = getApiBase();
export const ADMIN_BASE = getAdminBase();

// Simple sanitizer for input data to prevent XSS attacks
export function sanitizeInput<T>(data: T): T {
  if (typeof data === 'string') {
    // Basic sanitization of HTML tags
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;') as unknown as T;
  }
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item)) as unknown as T;
  }
  
  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    sanitizedObj[key] = sanitizeInput(value);
  }
  
  return sanitizedObj as unknown as T;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('vf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add CSRF token if available
  const csrfToken = localStorage.getItem('vf_csrf_token');
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  // Sanitize request body if it's a JSON string
  let body = options.body;
  if (body && typeof body === 'string' && headers['Content-Type'] === 'application/json') {
    try {
      const parsed = JSON.parse(body);
      const sanitized = sanitizeInput(parsed);
      body = JSON.stringify(sanitized);
    } catch (e) {
      // If parsing fails, use the original body
    }
  }
  
  const modifiedOptions = { ...options, headers, body };
  
  const res = await fetch(`${API_BASE}${path}`, modifiedOptions);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function adminFetch(
  path: string,
  username: string,
  password: string,
  options: RequestInit = {}
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    Authorization: 'Basic ' + btoa(`${username}:${password}`),
  };
  const res = await fetch(`${ADMIN_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}
