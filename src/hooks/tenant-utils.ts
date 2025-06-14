import { TenantContext } from './tenant-context';

// Function to get the tenant ID from localStorage or return null if not available
export const getStoredTenantId = (): string | null => {
  return localStorage.getItem('vf_selected_tenant');
};

// Function to set the tenant ID in localStorage
export const setStoredTenantId = (id: string | null): void => {
  if (id) {
    localStorage.setItem('vf_selected_tenant', id);
  } else {
    localStorage.removeItem('vf_selected_tenant');
  }
};
