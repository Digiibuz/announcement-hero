
import { Provider } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: 'admin' | 'editor' | 'client';
  clientId?: string | null;
  wordpressConfigId?: string | null;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
  isOnResetPasswordPage: boolean;
}

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegistrationFormValues {
  email: string;
  name: string;
  password: string;
  passwordConfirm: string;
}

export interface EmailConfirmationValues {
  email: string;
}

export interface ResetPasswordValues {
  password: string;
  confirm_password: string;
}

export interface UserFormValues {
  email: string;
  name?: string;
  role: 'admin' | 'editor' | 'client';
  wordpress_config_id?: string;
  password?: string;
  password_confirmation?: string;
  client_id?: string;
}

export type UserFormErrors = {
  email?: string;
  name?: string;
  role?: string;
  wordpress_config_id?: string;
  password?: string;
  password_confirmation?: string;
  client_id?: string;
};
