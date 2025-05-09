
import { supabase, withInitializedClient, cleanupAuthState } from "@/integrations/supabase/client";
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
      // Nettoyer l'état d'authentification avant la connexion pour éviter les conflits
      await cleanupAuthState();
      
      // S'assurer que le client est initialisé avant de tenter la connexion
      await withInitializedClient(async () => {
        // Tenter de se déconnecter globalement pour éviter les conflits de session
        try {
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.warn("Erreur lors de la déconnexion préalable:", e);
          // Continuer même si cette étape échoue
        }
        
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
      console.error("Erreur de connexion:", error);
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      // S'assurer que le client est initialisé avant de tenter la déconnexion
      await withInitializedClient(async () => {
        // Nettoyage des données persistantes
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('lastAdminPath');
        sessionStorage.removeItem('lastAuthenticatedPath');
        
        try {
          // Tentative de déconnexion globale pour être sûr
          await supabase.auth.signOut({ scope: 'global' });
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
          // Continuer malgré l'erreur et nettoyer manuellement
          await cleanupAuthState();
        }
        
        setUserProfile(null);
        localStorage.removeItem("originalUser");
        
        // Pour s'assurer d'une déconnexion propre, on peut réinitialiser le client
        await cleanupAuthState();
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // En cas d'erreur, forcer le nettoyage de l'état
      await cleanupAuthState();
      setUserProfile(null);
      toast.error("Erreur lors de la déconnexion, l'application a été réinitialisée");
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
