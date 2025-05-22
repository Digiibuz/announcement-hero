
import { UserProfile } from "@/types/auth";

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
  isOnResetPasswordPage: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
}

export interface AuthContextType extends AuthState, AuthActions {}
