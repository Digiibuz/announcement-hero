
import { supabase, withInitializedClient } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

export const useAuthActions = (
  setUserProfile: (profile: UserProfile | null) => void,
  userProfile: UserProfile | null,
  originalUser: UserProfile | null,
  startImpersonation: (userToImpersonate: UserProfile) => UserProfile | null,
  endImpersonation: () => UserProfile | null
) => {
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // S'assurer que le client est initialisé avant de tenter la connexion
      await withInitializedClient(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw error;
        }
        
        // User will be set by the auth state change listener
      });
    } catch (error: any) {
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      // S'assurer que le client est initialisé avant de tenter la déconnexion
      await withInitializedClient(async () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('lastAdminPath');
        sessionStorage.removeItem('lastAuthenticatedPath');
        
        await supabase.auth.signOut();
        setUserProfile(null);
        localStorage.removeItem("originalUser");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
    }
  };

  const stopImpersonating = () => {
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
    }
  };

  return {
    login,
    logout,
    impersonateUser,
    stopImpersonating
  };
};
