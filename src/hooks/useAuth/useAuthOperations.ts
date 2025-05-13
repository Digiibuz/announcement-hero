
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
      const apiUrl = `${window.location.origin}/api/auth`;
      console.log("Auth API URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
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
        const errorText = await response.text();
        let errorData;
        
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error("Failed to parse error response:", errorText);
          throw new Error("Failed to parse server response");
        }
        
        console.error("Login failed:", errorData);
        throw new Error(errorData.error || "Failed to login");
      }
      
      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
        console.log("Login response parsed successfully");
      } catch (e) {
        console.error("Failed to parse login response:", responseText);
        throw new Error("Failed to parse server response");
      }
      
      const { session, user } = responseData;
      
      if (!session || !user) {
        console.error("Invalid authentication data:", responseData);
        throw new Error("Invalid authentication data");
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
      
    } catch (error: any) {
      console.error("Login error:", error);
      setIsLoading(false);
      throw new Error(error.message || "Login error");
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
