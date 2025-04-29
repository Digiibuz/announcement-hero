
import { User, Session } from "@supabase/supabase-js";
import { UserProfile } from "@/types/auth";

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isOnResetPasswordPage: boolean;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
}

// Define roles type
export type Role = 'admin' | 'client' | 'user';

// Helper function to check user roles
export const hasRole = (user: UserProfile | null, role: Role): boolean => {
  if (!user) return false;
  return user.role === role;
};
