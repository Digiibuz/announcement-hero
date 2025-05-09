
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, withInitializedClient } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

// Helper function to create a profile from user metadata
const createProfileFromMetadata = (user: User): UserProfile => {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'client',
    clientId: user.user_metadata?.client_id,
    wordpressConfigId: user.user_metadata?.wordpress_config_id,
    wordpressConfig: null,
    lastLogin: user.last_sign_in_at || null,
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);
  // État pour suivre si nous sommes sur une page de réinitialisation de mot de passe
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
    
    const setupAuthListener = async () => {
      try {
        // Attendre que le client soit initialisé
        await withInitializedClient(async () => {
          // Set up the auth state change listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
          
          return subscription;
        });
      } catch (error) {
        console.error("Error setting up auth listener:", error);
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
          
          const { data: { session } } = await supabase.auth.getSession();
          
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
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUserProfile(null);
        setIsLoading(false);
      }
    };

    const setup = async () => {
      await setupAuthListener();
      await initializeAuth();
    };
    
    setup();
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // S'assurer que le client est initialisé avant de tenter la connexion
      return await withInitializedClient(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          throw error;
        }
        
        // User will be set by the auth state change listener
        return data;
      });
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      // S'assurer que le client est initialisé avant de tenter la déconnexion
      await withInitializedClient(async () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('lastAdminPath');
        sessionStorage.removeItem('lastAuthenticatedPath');
        
        await supabase.auth.signOut();
        setUserProfile(null);
        localStorage.removeItem("originalUser");
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
      localStorage.setItem('userRole', impersonatedUser.role);
      localStorage.setItem('userId', impersonatedUser.id);
    }
  };

  const stopImpersonating = () => {
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
      localStorage.setItem('userRole', originalUserProfile.role);
      localStorage.setItem('userId', originalUserProfile.id);
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
