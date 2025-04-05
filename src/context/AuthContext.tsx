
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if we're on the password reset page
  useEffect(() => {
    const isResetPasswordPage = window.location.pathname === '/reset-password';
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    
    setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    console.log("Is on reset password page:", isResetPasswordPage, "Has recovery token:", hasRecoveryToken);
  }, [window.location.pathname, window.location.hash]);

  // Initialize auth state and set up listeners with improved persistence
  useEffect(() => {
    console.log("Setting up auth state listener");
    let attemptCount = 0;
    const maxAttempts = 3;
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "Session exists" : "No session");
        
        // Just update the session state
        setSession(currentSession);
        setAuthError(null);
        
        if (currentSession?.user) {
          // First set user from metadata for immediate UI feedback
          const initialProfile = createProfileFromMetadata(currentSession.user);
          setUserProfile(initialProfile);
          console.log("Initial profile from metadata:", initialProfile);
          
          // Then asynchronously fetch the complete profile
          setTimeout(() => {
            fetchFullProfile(currentSession.user.id).then((success) => {
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
        
        // Mark that we've checked for a session
        setSessionChecked(true);
      }
    );

    // Then get the initial session with retry mechanism
    const initializeAuth = async () => {
      try {
        // First check if we have a locally cached user role
        const cachedUserRole = localStorage.getItem('userRole');
        const cachedUserId = localStorage.getItem('userId');
        
        while (attemptCount < maxAttempts) {
          try {
            console.log(`Session initialization attempt ${attemptCount + 1}/${maxAttempts}`);
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error retrieving initial session:", error);
              attemptCount++;
              if (attemptCount >= maxAttempts) {
                setUserProfile(null);
                setIsLoading(false);
                setSessionChecked(true);
                setAuthError("Impossible de récupérer la session");
              }
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
            
            // Update session state
            setSession(data.session);
            
            if (data.session?.user) {
              console.log("Session found during initialization:", data.session.user.id);
              // First set user from metadata
              const initialProfile = createProfileFromMetadata(data.session.user);
              
              // Apply cached role if available for immediate UI
              if (cachedUserRole && cachedUserId === data.session.user.id) {
                initialProfile.role = cachedUserRole as any;
                console.log("Applied cached role:", cachedUserRole);
              }
              
              setUserProfile(initialProfile);
              
              // Then get complete profile
              setTimeout(() => {
                fetchFullProfile(data.session.user.id).then((success) => {
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
            
            // Mark that we've checked for a session
            setSessionChecked(true);
            break; // Exit the loop if successful
          } catch (e) {
            console.error(`Session initialization attempt ${attemptCount + 1} failed:`, e);
            attemptCount++;
            if (attemptCount >= maxAttempts) {
              setUserProfile(null);
              setIsLoading(false);
              setSessionChecked(true);
              setAuthError("Erreur de connexion au serveur");
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error("Exception during auth initialization:", error);
        setUserProfile(null);
        setIsLoading(false);
        setSessionChecked(true);
        setAuthError("Erreur pendant l'initialisation de l'authentification");
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // Update session state
      setSession(data.session);
      
      // User will be set by the auth state change listener
      return data;
    } catch (error: any) {
      setIsLoading(false);
      setAuthError(error.message || "Erreur d'authentification");
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      sessionStorage.removeItem('google_auth_in_progress');
      
      await supabase.auth.signOut();
      setSession(null);
      setUserProfile(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Impersonation wrappers
  const impersonateUser = (userToImpersonate: UserProfile) => {
    // Only allow admins to impersonate
    if (!userProfile || userProfile.role !== "admin") return;
    
    // Use the startImpersonation function from useImpersonation hook
    return startImpersonation(userToImpersonate);
  };

  const stopImpersonating = () => {
    // Use the endImpersonation function from useImpersonation hook
    return endImpersonation();
  };

  const value: AuthContextType = {
    user: userProfile,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile && !!session,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
    isOnResetPasswordPage,
    sessionChecked,
    authError,
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
