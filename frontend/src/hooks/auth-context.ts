import { createContext } from 'react';

export interface UserInfo {
  user_id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

export interface AuthContextProps {
  token: string | null;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (first: string, last: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);
