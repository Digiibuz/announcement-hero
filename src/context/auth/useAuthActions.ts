
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { AuthActions } from "./types";
import { useImpersonation } from "@/hooks/useImpersonation";

interface UseAuthActionsProps {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function useAuthActions({
  userProfile,
  setUserProfile,
  setIsLoading
}: UseAuthActionsProps): AuthActions {
  const { impersonateUser, stopImpersonating } = useImpersonation(userProfile);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Tentative de connexion avec:", email);
      
      // Nettoyage des états d'authentification précédents
      const cleanupAuthState = () => {
        try {
          // Supprimer tous les tokens Supabase du localStorage
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
              console.log("Suppression de la clé de stockage:", key);
              localStorage.removeItem(key);
            }
          });
          
          // Supprimer également du sessionStorage si utilisé
          Object.keys(sessionStorage || {}).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
              sessionStorage.removeItem(key);
            }
          });
          
          console.log("Nettoyage d'état d'authentification terminé");
        } catch (err) {
          console.warn("Erreur lors du nettoyage des tokens:", err);
        }
      };
      
      // Nettoyer les états d'authentification précédents
      cleanupAuthState();
      
      // Tenter une déconnexion globale pour éviter tout état incohérent
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion globale effectuée avec succès");
      } catch (err) {
        console.warn("Erreur lors de la déconnexion globale:", err);
        // Continuer même si cela échoue
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log("Résultat de la connexion:", data ? "Succès" : "Échec", error || "");
      
      if (error) {
        console.error("Erreur de connexion Supabase:", error);
        throw error;
      }
      
      if (!data?.user) {
        throw new Error("L'utilisateur n'a pas été trouvé après connexion");
      }
      
      // User will be set by the auth state change listener
      return data;
    } catch (error: any) {
      setIsLoading(false);
      console.error("Erreur de connexion:", error);
      throw new Error(error.message || "Erreur de connexion");
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      
      await supabase.auth.signOut();
      setUserProfile(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Impersonation wrappers
  const impersonateUserWrapper = (userToImpersonate: UserProfile) => {
    const impersonatedUser = impersonateUser(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
    }
  };

  const stopImpersonatingWrapper = () => {
    const originalUserProfile = stopImpersonating();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
    }
  };

  return {
    login,
    logout,
    impersonateUser: impersonateUserWrapper,
    stopImpersonating: stopImpersonatingWrapper
  };
}
