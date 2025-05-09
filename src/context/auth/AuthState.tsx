
import { useState, useEffect } from "react";
import { supabase, withInitializedClient, cleanupAuthState } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { AuthState } from "./types";
import { createProfileFromMetadata } from "./utils";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

export const useAuthState = (): AuthState & {
  setUserProfile: (profile: UserProfile | null) => void;
  fetchFullProfile: (id: string) => Promise<boolean>;
} => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile, error } = useUserProfile();
  const { originalUser, isImpersonating } = useImpersonation(userProfile);
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);

  // Vérifier si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    // Vérifier si nous sommes sur la page de réinitialisation ET si nous avons des tokens dans l'URL
    const isResetPasswordPage = window.location.pathname === '/reset-password';
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    
    setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    console.log("Is on reset password page:", isResetPasswordPage, "Has recovery token:", hasRecoveryToken);
  }, [window.location.pathname, window.location.hash]);

  // Initialize auth state and set up listeners with improved persistence
  useEffect(() => {
    console.log("Setting up auth state listener");
    let subscription: { unsubscribe: () => void } | null = null;
    
    const setupAuthListener = async () => {
      try {
        // Attendre que le client soit initialisé
        await withInitializedClient(async () => {
          // En cas de problèmes persistants, essayez de nettoyer l'état
          if (localStorage.getItem('auth-retry-needed') === 'true') {
            console.log("Nettoyage de l'état d'authentification suite à un problème précédent");
            localStorage.removeItem('auth-retry-needed');
            await cleanupAuthState();
          }
          
          // Set up the auth state change listener
          const { data } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log("Auth state changed:", event);
              setIsLoading(true);
              
              if (session?.user) {
                // First set user from metadata for immediate UI feedback
                const initialProfile: UserProfile = createProfileFromMetadata(session.user);
                setUserProfile(initialProfile);
                console.log("Initial profile from metadata:", initialProfile);
                
                // Then asynchronously fetch the complete profile
                setTimeout(() => {
                  fetchFullProfile(session.user.id).then((success) => {
                    if (!success) {
                      console.warn("Failed to fetch complete profile, using metadata only");
                      // Marquer pour un nettoyage lors de la prochaine tentative
                      localStorage.setItem('auth-retry-needed', 'true');
                    } else {
                      localStorage.removeItem('auth-retry-needed');
                    }
                    setIsLoading(false);
                  });
                }, 100);
              } else {
                setUserProfile(null);
                setIsLoading(false);
              }
            }
          );
          
          subscription = data.subscription;
        });
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        toast.error("Problème de connexion avec le serveur d'authentification");
        setIsLoading(false);
      }
    };
    
    // Get initial session with improved caching
    const initializeAuth = async () => {
      try {
        // Attendre que le client soit initialisé
        await withInitializedClient(async () => {
          // First check if we have a locally cached user role
          const cachedUserRole = localStorage.getItem('userRole');
          const cachedUserId = localStorage.getItem('userId');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session:", error);
            toast.error("Problème lors de la récupération de la session");
            // Marquer pour un nettoyage lors de la prochaine tentative
            localStorage.setItem('auth-retry-needed', 'true');
            setIsLoading(false);
            return;
          }
          
          if (session?.user) {
            console.log("Session found during initialization");
            // First set user from metadata
            const initialProfile: UserProfile = createProfileFromMetadata(session.user);
            
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
                  localStorage.removeItem('auth-retry-needed');
                } else {
                  console.warn("Failed to fetch complete profile, using metadata only");
                  localStorage.setItem('auth-retry-needed', 'true');
                }
                setIsLoading(false);
              });
            }, 100);
          } else {
            console.log("No session found during initialization");
            setUserProfile(null);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        toast.error("Erreur d'initialisation de l'authentification");
        setUserProfile(null);
        setIsLoading(false);
      }
    };

    const setup = async () => {
      await setupAuthListener();
      await initializeAuth();
    };
    
    setup();
    
    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Cache the user role when it changes
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('userRole', userProfile.role);
      localStorage.setItem('userId', userProfile.id);
      console.log("Cached user role:", userProfile.role);
    } else {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  }, [userProfile?.role, userProfile?.id]);

  return {
    userProfile, 
    isLoading, 
    originalUser, 
    isImpersonating,
    isOnResetPasswordPage,
    error,
    setUserProfile,
    fetchFullProfile
  };
};
