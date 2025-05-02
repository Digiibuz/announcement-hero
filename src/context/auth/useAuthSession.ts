
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";

export const useAuthSession = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();

  // Check if we're on the password reset page
  useEffect(() => {
    try {
      const isResetPasswordPage = window.location.pathname === '/reset-password';
      const hasRecoveryToken = window.location.hash.includes('type=recovery');
      
      setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    } catch (error) {
      // Silence this error
    }
  }, [window.location.pathname, window.location.hash]);

  // Initialize auth state and set up listeners
  useEffect(() => {
    try {
      let isSubscribed = true; // Pour éviter les mises à jour après démontage du composant
      
      // Set up the auth state change listener
      const setupAuthListener = async () => {
        try {
          const { data: { subscription } } = await supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (!isSubscribed) return; // Ne pas mettre à jour si démonté
              
              try {
                setIsLoading(true);
                
                if (session?.user) {
                  // First set user from metadata for immediate UI feedback
                  const initialProfile = createProfileFromMetadata(session.user);
                  setUserProfile(initialProfile);
                  
                  // Then asynchronously fetch the complete profile
                  setTimeout(() => {
                    if (!isSubscribed) return;
                    fetchFullProfile(session.user.id)
                      .then(() => {
                        if (isSubscribed) setIsLoading(false);
                      })
                      .catch(() => {
                        if (isSubscribed) setIsLoading(false);
                      });
                  }, 100);
                } else {
                  setUserProfile(null);
                  setIsLoading(false);
                }
              } catch (error) {
                if (isSubscribed) setIsLoading(false);
              }
            }
          );
          
          return subscription;
        } catch (error) {
          // Silence cette erreur
          return { unsubscribe: () => {} };
        }
      };

      // Get initial session
      const initializeAuth = async () => {
        try {
          // First check if we have a locally cached user role
          const cachedUserRole = localStorage.getItem('userRole');
          const cachedUserId = localStorage.getItem('userId');
          
          const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
          
          if (!isSubscribed) return;
          
          if (session?.user) {
            // First set user from metadata
            const initialProfile = createProfileFromMetadata(session.user);
            
            // Apply cached role if available for immediate UI
            if (cachedUserRole && cachedUserId === session.user.id) {
              initialProfile.role = cachedUserRole as any;
            }
            
            setUserProfile(initialProfile);
            
            // Then get complete profile
            setTimeout(() => {
              if (!isSubscribed) return;
              fetchFullProfile(session.user.id)
                .then(() => {
                  if (isSubscribed) setIsLoading(false);
                })
                .catch(() => {
                  if (isSubscribed) setIsLoading(false);
                });
            }, 100);
          } else {
            setUserProfile(null);
            setIsLoading(false);
          }
        } catch (error) {
          if (isSubscribed) {
            setUserProfile(null);
            setIsLoading(false);
          }
        }
      };

      // Initialiser l'authentification et configurer les écouteurs d'événements
      let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} };
      
      Promise.all([
        setupAuthListener().then(sub => {
          subscription = sub;
        }),
        initializeAuth()
      ]).catch(() => {
        // Silence les erreurs pendant l'initialisation
        if (isSubscribed) {
          setUserProfile(null);
          setIsLoading(false);
        }
      });

      // Nettoyer lors du démontage
      return () => {
        isSubscribed = false;
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Silence cette erreur
        }
      };
    } catch (error) {
      setIsLoading(false);
    }
  }, [fetchFullProfile, setUserProfile]);

  // Cache the user role when it changes
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('userRole', userProfile.role);
        localStorage.setItem('userId', userProfile.id);
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
      }
    } catch (error) {
      // Silence cette erreur
    }
  }, [userProfile?.role, userProfile?.id]);

  return {
    userProfile,
    isLoading,
    isOnResetPasswordPage
  };
};
