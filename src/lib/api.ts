export const API_BASE = import.meta.env.VITE_API_URL || '';
export const ADMIN_BASE = import.meta.env.VITE_ADMIN_URL || '';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('vf_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
