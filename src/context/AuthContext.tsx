
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timeout pour les requêtes Supabase (en ms)
const REQUEST_TIMEOUT = 15000; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: startImpersonation, stopImpersonating: endImpersonation } = useImpersonation(userProfile);
  // État pour suivre si nous sommes sur une page de réinitialisation de mot de passe
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(false);
  // État pour suivre les tentatives de reconnexion
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [networkError, setNetworkError] = useState(false);

  // Fonction pour vérifier la connectivité réseau
  const checkNetworkConnectivity = useCallback(() => {
    return window.navigator.onLine;
  }, []);

  // Vérifier si nous sommes sur la page de réinitialisation de mot de passe
  useEffect(() => {
    // Vérifier si nous sommes sur la page de réinitialisation ET si nous avons des tokens dans l'URL
    const isResetPasswordPage = window.location.pathname === '/reset-password';
    const hasRecoveryToken = window.location.hash.includes('type=recovery');
    
    setIsOnResetPasswordPage(isResetPasswordPage && (hasRecoveryToken || isResetPasswordPage));
    console.log("Is on reset password page:", isResetPasswordPage, "Has recovery token:", hasRecoveryToken);
  }, [window.location.pathname, window.location.hash]);

  // Surveiller la connectivité réseau
  useEffect(() => {
    const handleOnline = () => {
      setNetworkError(false);
      if (reconnectAttempts > 0) {
        toast.success("Connexion réseau rétablie");
        // Essayer de restaurer la session
        initializeAuth();
      }
    };

    const handleOffline = () => {
      setNetworkError(true);
      toast.error("Connexion réseau perdue");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [reconnectAttempts]);

  // Initialize auth state and set up listeners with improved persistence
  useEffect(() => {
    console.log("Setting up auth state listener");
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        setIsLoading(true);
        
        if (session?.user) {
          // First set user from metadata for immediate UI feedback
          const initialProfile = createProfileFromMetadata(session.user);
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

    // Get initial session with improved caching
    initializeAuth();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Function to initialize auth state with retry logic
  const initializeAuth = async () => {
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
  };

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

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Vérifier d'abord la connectivité réseau
      if (!checkNetworkConnectivity()) {
        throw new Error("Pas de connexion internet. Veuillez vérifier votre connexion réseau.");
      }
      
      // Utiliser Promise.race pour implémenter un timeout
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
    isNetworkError: networkError,
    retryConnection: initializeAuth,
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
