
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cleanupAuthState } from "@/utils/auth/cleanupAuth";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useAuthOperations = (
  setUserProfile: (profile: UserProfile | null) => void
) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Login implementation using edge function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("Login attempt for:", email);
    
    try {
      // Clean up any existing auth state first
      cleanupAuthState();
      console.log("Auth state cleaned up");
      
      // Try to sign out globally before logging in to prevent conflicts
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Global sign out completed");
      } catch (err) {
        console.warn("Failed to sign out globally:", err);
        // Continue anyway
      }
      
      // Use the edge function for authentication
      console.log("Calling auth edge function for login");
      const baseUrl = window.location.origin;
      const apiUrl = `${baseUrl}/api/auth`;
      console.log("Auth API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });
      
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          
          // Check if the response is HTML instead of JSON
          if (errorText.trim().startsWith('<!DOCTYPE html>') || 
              errorText.trim().startsWith('<html>')) {
            console.error("Received HTML instead of JSON:", errorText.substring(0, 200));
            throw new Error("Le serveur a retourné une réponse HTML au lieu de JSON. Veuillez contacter l'administrateur.");
          }
          
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            console.error("Failed to parse error response:", errorText);
            throw new Error("Échec de l'analyse de la réponse du serveur");
          }
          
          console.error("Login failed:", errorData);
          throw new Error(errorData.error || "Échec de connexion");
        } catch (e) {
          if (e.message.includes("HTML")) {
            throw e; // Rethrow the HTML error
          }
          console.error("Error handling response:", e);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
      }
      
      let responseText;
      try {
        responseText = await response.text();
        
        // Check if the response is HTML instead of JSON
        if (responseText.trim().startsWith('<!DOCTYPE html>') || 
            responseText.trim().startsWith('<html>')) {
          console.error("Received HTML instead of JSON:", responseText.substring(0, 200));
          throw new Error("Le serveur a retourné une réponse HTML au lieu de JSON. Veuillez contacter l'administrateur.");
        }
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("Login response parsed successfully");
        } catch (e) {
          console.error("Failed to parse login response:", responseText.substring(0, 200));
          throw new Error("Échec de l'analyse de la réponse du serveur");
        }
        
        const { session, user } = responseData;
        
        if (!session || !user) {
          console.error("Invalid authentication data:", responseData);
          throw new Error("Données d'authentification invalides");
        }
        
        console.log("Setting Supabase session");
        // Update the session in client-side Supabase
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        
        console.log("Login successful");
        setIsLoading(false);
        // Auth state change listener will handle the rest
        
      } catch (e) {
        console.error("Error processing login response:", e);
        throw new Error(e.message || "Erreur lors du traitement de la réponse de connexion");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      throw new Error(error.message || "Erreur de connexion");
    }
  };

  // Logout implementation using edge function
  const logout = async () => {
    console.log("Logout initiated");
    try {
      // Clean up local storage first
      cleanupAuthState();
      console.log("Auth state cleaned up");
      
      // Clear additional storage items
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      localStorage.removeItem("originalUser");
      
      try {
        // Get the current session token if available
        const sessionResult = await supabase.auth.getSession();
        console.log("Session retrieved for logout");
        const accessToken = sessionResult.data.session?.access_token;
        
        // Call the edge function for logout if we have a token
        if (accessToken) {
          console.log("Calling auth edge function for logout");
          const baseUrl = window.location.origin;
          await fetch(`${baseUrl}/api/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              action: 'logout'
            })
          });
          console.log("Logout API call completed");
        }
      } catch (apiError) {
        console.warn("Failed to call logout API:", apiError);
        // Continue despite the error
      }
      
      // Additional client-side cleanup
      await supabase.auth.signOut();
      console.log("Client-side sign out completed");
      setUserProfile(null);
    } catch (error) {
      console.error("Error during logout:", error);
      // Still try to clear the user profile
      setUserProfile(null);
    }
  };

  return {
    isLoading,
    setIsLoading,
    login,
    logout
  };
};
