
import { supabase, withInitializedClient, cleanupAuthState, getDebugInfo } from "@/integrations/supabase/client";
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
      return await withInitializedClient(async () => {
        console.log("Client initialisé, tentative de déconnexion préalable");
        
        // Tenter de se déconnecter globalement pour éviter les conflits de session
        try {
          // Enregistrer l'état de débogage actuel
          console.log("État de débogage avant déconnexion:", getDebugInfo());
          
          await supabase.auth.signOut({ scope: 'global' });
          console.log("Déconnexion préalable réussie");
        } catch (e) {
          console.warn("Erreur lors de la déconnexion préalable:", e);
          // Continuer même si cette étape échoue
        }
        
        console.log("Tentative de connexion avec email/password");
        
        // Utiliser un délai très court entre la déconnexion et la nouvelle connexion
        // pour éviter les conflits potentiels
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Tentative de connexion avec retry en cas d'échec
        const MAX_RETRIES = 2;
        let attempts = 0;
        let lastError = null;
        
        while (attempts < MAX_RETRIES) {
          try {
            console.log(`Tentative de connexion ${attempts + 1}/${MAX_RETRIES}`);
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (error) {
              console.error(`Erreur de connexion (tentative ${attempts + 1}):`, error);
              lastError = error;
              attempts++;
              
              if (attempts < MAX_RETRIES) {
                console.log("Attente avant nouvelle tentative...");
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                continue;
              } else {
                throw error;
              }
            }
            
            console.log("Connexion réussie avec données:", data ? "Données présentes" : "Pas de données");
            break; // Sortie de la boucle si succès
          } catch (e) {
            console.error(`Erreur exceptionnelle lors de la tentative ${attempts + 1}:`, e);
            lastError = e;
            attempts++;
            
            if (attempts < MAX_RETRIES) {
              console.log("Attente avant nouvelle tentative...");
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            } else {
              throw e;
            }
          }
        }
        
        if (lastError && attempts >= MAX_RETRIES) {
          console.error("Échec après toutes les tentatives:", lastError);
          throw lastError;
        }

        // Vérification supplémentaire pour le débogage
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          console.log("Session après connexion:", sessionData?.session ? "Présente" : "Absente");
          
          if (!sessionData?.session) {
            console.warn("Session non détectée après login réussi");
            toast.info("Connexion réussie, mais la session n'est pas encore disponible");
          }
        } catch (e) {
          console.error("Erreur lors de la vérification de session:", e);
        }

        // Donner le temps au système de propager l'authentification
        return new Promise<void>((resolve) => {
          console.log("Attente de propagation de l'authentification...");
          setTimeout(() => {
            console.log("Délai terminé, authentification complète");
            resolve();
          }, 800);
        });
      });
    } catch (error: any) {
      console.error("Erreur de connexion complète:", error);
      if (error.status === 401 || error.message?.includes("Unauthorized")) {
        console.error("Erreur d'authentification 401, réinitialisation nécessaire");
        localStorage.setItem('auth-needs-reset', 'true');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Début du processus de déconnexion");
      // S'assurer que le client est initialisé avant de tenter la déconnexion
      await withInitializedClient(async () => {
        // Sauvegarde des données non-auth importantes
        const keysToKeep = ['theme', 'language', 'preferences'];
        const dataToKeep: Record<string, string> = {};
        
        keysToKeep.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            dataToKeep[key] = value;
          }
        });
        
        // Nettoyage des données persistantes
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('lastAdminPath');
        sessionStorage.removeItem('lastAuthenticatedPath');
        
        try {
          console.log("Tentative de déconnexion globale");
          // Enregistrer l'état de débogage actuel
          console.log("État de débogage avant déconnexion:", getDebugInfo());
          
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
        
        // Restaurer les données importantes
        Object.keys(dataToKeep).forEach(key => {
          localStorage.setItem(key, dataToKeep[key]);
        });
        
        // Pour s'assurer d'une déconnexion propre
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
