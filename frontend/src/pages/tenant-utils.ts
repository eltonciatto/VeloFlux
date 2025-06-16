// Utility functions and interfaces for tenant management
export interface Tenant {
  id: string;
  name: string;
  plan: string;
  active: boolean;
  contact_email: string;
  custom_domain?: string;
  created_at: string;
}

export interface NewTenant {
  id: string;
  name: string;
  plan: string;
  contact_email: string;
  custom_domain: string;
}
