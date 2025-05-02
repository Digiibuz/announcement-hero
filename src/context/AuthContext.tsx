
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);
  // État pour suivre si nous sommes sur une page de réinitialisation de mot de passe
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);

  // Vérifier si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    try {
      // Vérifier si nous sommes sur la page de réinitialisation ET si nous avons des tokens dans l'URL
      const isResetPasswordPage = window.location.pathname === '/reset-password';
      const hasRecoveryToken = window.location.hash.includes('type=recovery');
      
      setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
      // Suppression du log de débogage
    } catch (error) {
      // Silence cette erreur pour ne pas l'afficher dans la console
    }
  }, [window.location.pathname, window.location.hash]);

  // Initialize auth state and set up listeners with improved persistence
  useEffect(() => {
    try {
      // Suppression du log de débogage

      // Set up the auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            // Suppression du log de débogage
            setIsLoading(true);
            
            if (session?.user) {
              // First set user from metadata for immediate UI feedback
              const initialProfile = createProfileFromMetadata(session.user);
              setUserProfile(initialProfile);
              // Suppression du log de débogage
              
              // Then asynchronously fetch the complete profile
              setTimeout(() => {
                fetchFullProfile(session.user.id).then((success) => {
                  if (!success) {
                    // Suppression du log d'avertissement
                  }
                  setIsLoading(false);
                }).catch(() => {
                  // Silence les erreurs pour ne pas les afficher dans la console
                  setIsLoading(false);
                });
              }, 100);
            } else {
              setUserProfile(null);
              setIsLoading(false);
            }
          } catch (error) {
            // Silence cette erreur pour ne pas l'afficher dans la console
            setIsLoading(false);
          }
        }
      );

      // Get initial session with improved caching
      const initializeAuth = async () => {
        try {
          // First check if we have a locally cached user role
          const cachedUserRole = localStorage.getItem('userRole');
          const cachedUserId = localStorage.getItem('userId');
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Suppression du log de débogage
            // First set user from metadata
            const initialProfile = createProfileFromMetadata(session.user);
            
            // Apply cached role if available for immediate UI
            if (cachedUserRole && cachedUserId === session.user.id) {
              initialProfile.role = cachedUserRole as any;
              // Suppression du log de débogage
            }
            
            setUserProfile(initialProfile);
            
            // Then get complete profile
            setTimeout(() => {
              fetchFullProfile(session.user.id).then((success) => {
                if (success) {
                  // Suppression du log de débogage
                } else {
                  // Suppression du log d'avertissement
                }
                setIsLoading(false);
              }).catch(() => {
                // Silence les erreurs pour ne pas les afficher dans la console
                setIsLoading(false);
              });
            }, 100);
          } else {
            // Suppression du log de débogage
            setUserProfile(null);
            setIsLoading(false);
          }
        } catch (error) {
          // Silence cette erreur pour ne pas l'afficher dans la console
          setUserProfile(null);
          setIsLoading(false);
        }
      };

      initializeAuth();

      return () => {
        try {
          subscription.unsubscribe();
        } catch (error) {
          // Silence cette erreur pour ne pas l'afficher dans la console
        }
      };
    } catch (error) {
      // Silence cette erreur pour ne pas l'afficher dans la console
      setIsLoading(false);
    }
  }, []);

  // Cache the user role when it changes
  useEffect(() => {
    try {
      if (userProfile) {
        localStorage.setItem('userRole', userProfile.role);
        localStorage.setItem('userId', userProfile.id);
        // Suppression du log de débogage
      } else {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
      }
    } catch (error) {
      // Silence cette erreur pour ne pas l'afficher dans la console
    }
  }, [userProfile?.role, userProfile?.id]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // User will be set by the auth state change listener
      return data;
    } catch (error: any) {
      setIsLoading(false);
      throw error; // Renvoi de l'erreur pour la gestion dans la composante Login
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
      // Suppression du log d'erreur dans la console
      // Silence cette erreur
    }
  };

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    try {
      const impersonatedUser = startImpersonation(userToImpersonate);
      if (impersonatedUser) {
        setUserProfile(impersonatedUser);
        localStorage.setItem('userRole', impersonatedUser.role);
        localStorage.setItem('userId', impersonatedUser.id);
      }
      return impersonatedUser;
    } catch (error) {
      // Silence cette erreur pour ne pas l'afficher dans la console
      return null;
    }
  };

  const stopImpersonating = () => {
    try {
      const originalUserProfile = endImpersonation();
      if (originalUserProfile) {
        setUserProfile(originalUserProfile);
        localStorage.setItem('userRole', originalUserProfile.role);
        localStorage.setItem('userId', originalUserProfile.id);
      }
      return originalUserProfile;
    } catch (error) {
      // Silence cette erreur pour ne pas l'afficher dans la console
      return null;
    }
  };

  const value: AuthContextType = {
    user: userProfile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
    isOnResetPasswordPage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
