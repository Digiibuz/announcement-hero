
import { User } from "@supabase/supabase-js";

export type Role = "admin" | "client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
  wordpressConfigId?: string;
  wordpressConfig?: {
    name: string;
    site_url: string;
  } | null;
  lastLogin?: string | null;
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>; // Updated return type
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

export interface GoogleBusinessProfile {
  id: string;
  userId: string;
  googleEmail: string | null;
  gmb_account_id: string | null;
  gmb_location_id: string | null;
  created_at: string;
  updated_at: string;
  // Token fields
  refresh_token?: string;
  access_token?: string;
  token_expires_at?: string;
}
