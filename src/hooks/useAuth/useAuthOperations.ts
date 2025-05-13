
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/utils/auth/cleanupAuth";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useAuthOperations = (
  setUserProfile: (profile: UserProfile | null) => void
) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Nouvelle implémentation de login utilisant l'edge function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Nettoyer d'abord l'état d'authentification pour éviter les problèmes
      cleanupAuthState();
      
      // Tentons de nous déconnecter globalement avant de nous connecter
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuer même en cas d'échec
        console.warn("Échec de la déconnexion globale:", err);
      }
      
      // Utiliser l'edge function pour l'authentification
      const response = await fetch(`${window.location.origin}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la connexion");
      }
      
      const { session, user } = await response.json();
      
      if (!session || !user) {
        throw new Error("Données d'authentification invalides");
      }
      
      // Mettre à jour la session dans Supabase côté client
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      // Le reste sera géré par le listener onAuthStateChange
      
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login error");
    }
  };

  // Nouvelle implémentation de logout utilisant l'edge function
  const logout = async () => {
    try {
      // Nettoyer d'abord le stockage local
      cleanupAuthState();
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      localStorage.removeItem("originalUser");
      
      try {
        // Récupérer le token actuel si disponible
        const sessionResult = await supabase.auth.getSession();
        const accessToken = sessionResult.data.session?.access_token || '';
        
        // Appeler l'edge function pour la déconnexion uniquement si nous avons un token
        if (accessToken) {
          await fetch(`${window.location.origin}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              action: 'logout'
            })
          });
        }
      } catch (apiError) {
        console.warn("Échec de l'appel à l'API de déconnexion:", apiError);
        // Continuer malgré l'erreur
      }
      
      // Nettoyage supplémentaire côté client
      await supabase.auth.signOut();
      setUserProfile(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return {
    isLoading,
    setIsLoading,
    login,
    logout
  };
};
