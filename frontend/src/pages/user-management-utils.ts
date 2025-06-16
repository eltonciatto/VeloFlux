// User management utility types and functions
export interface User {
  user_id: string;
  email: string;
  tenant_id: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export interface NewUser {
  email: string;
  role: string;
  first_name: string;
  last_name: string;
}
