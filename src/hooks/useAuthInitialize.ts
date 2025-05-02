
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { createProfileFromMetadata } from "@/hooks/useUserProfile";
import { toast } from "sonner";

export const useAuthInitialize = (
  setUserProfile: (profile: UserProfile | null) => void,
  setIsLoading: (loading: boolean) => void,
  fetchFullProfile: (userId: string) => Promise<boolean>,
  setNetworkError: (error: boolean) => void,
  setReconnectAttempts: (fn: (prev: number) => number) => void,
  checkNetworkConnectivity: () => boolean,
  reconnectAttempts: number,
  REQUEST_TIMEOUT: number
) => {
  // Function to initialize auth state with retry logic
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // First check if we have a locally cached user role
      const cachedUserRole = localStorage.getItem('userRole');
      const cachedUserId = localStorage.getItem('userId');
      
      // Use Promise.race to implement a timeout
      const { data: { session }, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout lors de la récupération de la session")), REQUEST_TIMEOUT)
        )
      ]) as any;
      
      if (error) {
        console.error("Error getting session:", error);
        
        // Increment reconnect attempts for network issues
        if (error.message?.includes('network') || error.message?.includes('timeout') || !checkNetworkConnectivity()) {
          setReconnectAttempts(prev => prev + 1);
          setNetworkError(true);
          
          if (reconnectAttempts < 3) {
            // Schedule a retry with exponential backoff
            const backoff = Math.min(2000 * Math.pow(2, reconnectAttempts), 30000); // max 30s
            setTimeout(initializeAuth, backoff);
          } else {
            toast.error("Impossible de se connecter au serveur après plusieurs tentatives");
          }
        }
        
        setIsLoading(false);
        return;
      }
      
      // Reset reconnect attempts on successful connection
      if (reconnectAttempts > 0) {
        setReconnectAttempts(0);
        setNetworkError(false);
      }
      
      if (session?.user) {
        console.log("Session found during initialization");
        // First set user from metadata
        const initialProfile = createProfileFromMetadata(session.user);
        
        // Apply cached role if available for immediate UI
        if (cachedUserRole && cachedUserId === session.user.id) {
          initialProfile.role = cachedUserRole as any;
          console.log("Applied cached role:", cachedUserRole);
        }
        
        setUserProfile(initialProfile);
        
        // Then get complete profile
        setTimeout(() => {
          fetchFullProfile(session.user.id).then((success) => {
            if (success) {
              console.log("Successfully fetched complete profile");
            } else {
              console.warn("Failed to fetch complete profile, using metadata only");
            }
            setIsLoading(false);
          });
        }, 100);
      } else {
        console.log("No session found during initialization");
        setUserProfile(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error during auth initialization:", error);
      
      // Handle network errors specifically
      if (!checkNetworkConnectivity() || (error as Error).message?.includes('network') || (error as Error).message?.includes('timeout')) {
        setNetworkError(true);
        toast.error("Problème de connexion au serveur");
      }
      
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [reconnectAttempts, REQUEST_TIMEOUT, checkNetworkConnectivity, fetchFullProfile, setIsLoading, setNetworkError, setReconnectAttempts, setUserProfile]);

  return { initializeAuth };
};
