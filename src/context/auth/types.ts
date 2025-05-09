
import { UserProfile } from "@/types/auth";

export interface AuthState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
  isOnResetPasswordPage: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  impersonateUser: (userToImpersonate: UserProfile) => void;
  stopImpersonating: () => void;
  setUserProfile: (profile: UserProfile | null) => void;
  fetchFullProfile: (id: string) => Promise<boolean>;
}

export interface AuthContextType extends AuthState, AuthActions {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isClient: boolean;
}
