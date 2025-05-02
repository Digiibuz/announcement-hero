
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

export const useAuthMethods = (
  userProfile: UserProfile | null,
  setUserProfile: (profile: UserProfile | null) => void,
  setIsLoading: (loading: boolean) => void,
  checkNetworkConnectivity: () => boolean,
  REQUEST_TIMEOUT: number,
  fetchFullProfile: (userId: string) => Promise<boolean>,
  setNetworkError: (error: boolean) => void,
  setReconnectAttempts: (fn: (prev: number) => number) => void,
  initializeAuth: () => Promise<void>
) => {
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // First check network connectivity
      if (!checkNetworkConnectivity()) {
        throw new Error("Pas de connexion internet. Veuillez vérifier votre connexion réseau.");
      }
      
      // Use Promise.race to implement a timeout
      const result = await Promise.race([
        supabase.auth.signInWithPassword({
          email,
          password
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Délai d'attente dépassé lors de la connexion")), REQUEST_TIMEOUT)
        )
      ]) as any;
      
      if (!result) {
        throw new Error("Aucune réponse du serveur");
      }
      
      const { data, error } = result;
      
      if (error) {
        throw error;
      }
      
      if (!data.user || !data.session) {
        throw new Error("Échec de connexion: aucune session créée");
      }
      
      // User will be set by the auth state change listener
      return;
    } catch (error: any) {
      console.error("Login error details:", error);
      setIsLoading(false);
      
      // Improve error messages for network issues
      if (!window.navigator.onLine) {
        throw new Error("Pas de connexion internet. Veuillez vérifier votre connexion réseau.");
      } 
      
      if (error.message?.includes('timeout')) {
        throw new Error("Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.");
      }
      
      if (error.message?.includes('JSON')) {
        throw new Error("Erreur de communication avec le serveur. Veuillez réessayer.");
      }
      
      // Provide better error messages for common auth issues
      if (error.message?.includes('Invalid login') || error.message?.includes('Invalid email')) {
        throw new Error("Email ou mot de passe incorrect");
      }
      
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

  const retryConnection = async () => {
    try {
      await initializeAuth();
      return true;
    } catch (error) {
      console.error("Error retrying connection:", error);
      return false;
    }
  };

  return { login, logout, retryConnection };
};
