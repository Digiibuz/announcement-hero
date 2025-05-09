
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
      console.log("Début du processus de connexion pour:", email);
      
      // Nettoyer l'état d'authentification avant la connexion pour éviter les conflits
      console.log("Nettoyage de l'état d'authentification avant connexion");
      await cleanupAuthState();
      
      // S'assurer que le client est initialisé avant de tenter la connexion
      await withInitializedClient(async () => {
        console.log("Client initialisé, tentative de déconnexion préalable");
        
        // Tenter de se déconnecter globalement pour éviter les conflits de session
        try {
          await supabase.auth.signOut({ scope: 'global' });
          console.log("Déconnexion préalable réussie");
        } catch (e) {
          console.warn("Erreur lors de la déconnexion préalable:", e);
          // Continuer même si cette étape échoue
        }
        
        console.log("Tentative de connexion avec email/password");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          console.error("Erreur de connexion:", error);
          throw error;
        }
        
        console.log("Connexion réussie avec données:", data ? "Données présentes" : "Pas de données");
        // User will be set by the auth state change listener
      });
    } catch (error: any) {
      console.error("Erreur de connexion complète:", error);
      if (error.status === 401 || error.message?.includes("Unauthorized")) {
        console.error("Erreur d'authentification 401, réinitialisation nécessaire");
        localStorage.setItem('auth-needs-reset', 'true');
      }
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      console.log("Début du processus de déconnexion");
      // S'assurer que le client est initialisé avant de tenter la déconnexion
      await withInitializedClient(async () => {
        // Nettoyage des données persistantes
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('lastAdminPath');
        sessionStorage.removeItem('lastAuthenticatedPath');
        
        try {
          console.log("Tentative de déconnexion globale");
          // Tentative de déconnexion globale pour être sûr
          await supabase.auth.signOut({ scope: 'global' });
          console.log("Déconnexion réussie");
        } catch (e) {
          console.error("Erreur lors de la déconnexion:", e);
          // Continuer malgré l'erreur et nettoyer manuellement
          await cleanupAuthState();
        }
        
        setUserProfile(null);
        localStorage.removeItem("originalUser");
        
        // Pour s'assurer d'une déconnexion propre, on peut réinitialiser le client
        console.log("Nettoyage final post-déconnexion");
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
    console.log("Début de l'impersonation pour:", userToImpersonate.email);
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
      console.log("Impersonation réussie:", impersonatedUser.email);
    }
  };

  const stopImpersonating = () => {
    console.log("Arrêt de l'impersonation");
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
      console.log("Retour à l'utilisateur original:", originalUserProfile.email);
    }
  };

  return {
    login,
    logout,
    impersonateUser,
    stopImpersonating
  };
};
