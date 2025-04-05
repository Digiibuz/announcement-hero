
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
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  // Check if we're on the password reset page
  useEffect(() => {
    const isResetPasswordPage = window.location.pathname === '/reset-password';
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    
    setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    console.log("Is on reset password page:", isResetPasswordPage, "Has recovery token:", hasRecoveryToken);
  }, [window.location.pathname, window.location.hash]);

  // Analyze URL for auth params and handle callback more efficiently
  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check if we have auth parameters in the URL
      const url = window.location.href;
      const hasAccessToken = url.includes('#access_token=');
      const hasAuthCode = url.includes('?code=');
      const hasAuthError = url.includes('#error=') || url.includes('?error=');
      
      // If we detect any auth parameters, we're processing a callback
      if (hasAccessToken || hasAuthCode || hasAuthError) {
        console.log("Auth parameters detected in URL, starting callback processing");
        setIsProcessingCallback(true);
        
        try {
          // For token in URL fragment (#access_token=...)
          if (hasAccessToken) {
            console.log("Access token detected in URL fragment");
            
            // Let supabase handle the fragment parsing - it already knows how to do this
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error getting session from access_token:", error);
              setAuthError(`Error during authentication: ${error.message}`);
              setIsProcessingCallback(false);
              return;
            }
            
            if (data.session) {
              console.log("Successfully retrieved session from access_token");
              setSession(data.session);
              const initialProfile = createProfileFromMetadata(data.session.user);
              setUserProfile(initialProfile);
              
              // Fetch the complete profile after a short delay
              setTimeout(() => {
                fetchFullProfile(data.session!.user.id).finally(() => {
                  setIsLoading(false);
                  setIsProcessingCallback(false);
                });
              }, 200);
            } else {
              console.error("No session found after parsing access_token");
              setAuthError("Authentication failed: No session found");
              setIsProcessingCallback(false);
            }
          } 
          // For authorization code flow (?code=...)
          else if (hasAuthCode) {
            console.log("Auth code detected in URL query");
            
            // Let supabase handle the code exchange
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error exchanging auth code for session:", error);
              setAuthError(`Error during authentication: ${error.message}`);
              setIsProcessingCallback(false);
              return;
            }
            
            if (data.session) {
              console.log("Successfully exchanged auth code for session");
              setSession(data.session);
              const initialProfile = createProfileFromMetadata(data.session.user);
              setUserProfile(initialProfile);
              
              // Fetch the complete profile after a short delay
              setTimeout(() => {
                fetchFullProfile(data.session!.user.id).finally(() => {
                  setIsLoading(false);
                  setIsProcessingCallback(false);
                });
              }, 200);
            } else {
              console.error("No session found after exchanging auth code");
              setAuthError("Authentication failed: No session found");
              setIsProcessingCallback(false);
            }
          } 
          // For error responses
          else if (hasAuthError) {
            console.error("Auth error detected in URL");
            // Extract error details
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const queryParams = new URLSearchParams(window.location.search);
            
            const errorMessage = hashParams.get('error_description') || 
                                queryParams.get('error_description') || 
                                hashParams.get('error') ||
                                queryParams.get('error') ||
                                'Unknown authentication error';
            
            console.error("Auth error details:", errorMessage);
            setAuthError(`Authentication failed: ${errorMessage}`);
            setIsProcessingCallback(false);
          }
        } catch (err) {
          console.error("Exception during auth callback processing:", err);
          setAuthError("Authentication process failed unexpectedly");
          setIsProcessingCallback(false);
        }
      }
    };
    
    // Process auth callback if detected
    handleAuthCallback();
  }, [fetchFullProfile]);

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
        
        // Check if we have auth fragments in the URL that need to be processed
        const url = window.location.href;
        const hasAuthParams = url.includes('#access_token=') || url.includes('?code=') || url.includes('#error=');
        
        if (hasAuthParams) {
          console.log("Auth parameters detected in URL during initialization");
          // Let the dedicated effect handle this
          return;
        }
        
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
  }, [fetchFullProfile]);

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
    isProcessingCallback
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
