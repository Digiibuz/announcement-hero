
export type Role = "admin" | "editor";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  clientId?: string;
  wordpressConfigId?: string; // New field to associate a WordPress config with user
}

export interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  impersonateUser: (user: UserProfile) => void;
  stopImpersonating: () => void;
  originalUser: UserProfile | null;
  isImpersonating: boolean;
}
