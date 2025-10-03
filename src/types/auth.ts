import { Provider } from '@supabase/supabase-js';

export type Role = 'admin' | 'editor' | 'client' | 'commercial';

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  clientId?: string | null;
  wordpressConfigId?: string | null;
  lastLogin?: string | null;
  canPublishSocialMedia?: boolean | null;
  wordpressConfig?: {
    name: string;
    site_url: string;
  } | null;
}

export interface GoogleBusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  businessAddress: string;
  placeId: string;
  status: 'active' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
  googleEmail?: string;
  gmb_account_id?: string;
  gmb_location_id?: string;
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
  role: 'admin' | 'editor' | 'client' | 'commercial';
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
