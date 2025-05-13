
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fonction utilitaire pour nettoyer le stockage local des jetons d'authentification
const cleanupAuthState = () => {
  // Supprimer les jetons standard
  localStorage.removeItem('supabase.auth.token');
  
  // Supprimer toutes les clés d'authentification Supabase de localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Supprimer de sessionStorage si utilisé
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

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
    const initializeAuth = async () => {
      // First check if we have a locally cached user role
      const cachedUserRole = localStorage.getItem('userRole');
      const cachedUserId = localStorage.getItem('userId');
      
      const { data: { session } } = await supabase.auth.getSession();
      
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

  // Nouvelle implémentation de login utilisant l'edge function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Nettoyer d'abord l'état d'authentification pour éviter les problèmes
      cleanupAuthState();
      
      // Tentons de nous déconnecter globalement avant de nous connecter
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuer même en cas d'échec
        console.warn("Échec de la déconnexion globale:", err);
      }
      
      // Utiliser l'edge function pour l'authentification
      const response = await fetch(`${window.location.origin}/api/auth`, {
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la connexion");
      }
      
      const { session, user } = await response.json();
      
      if (!session || !user) {
        throw new Error("Données d'authentification invalides");
      }
      
      // Mettre à jour la session dans Supabase côté client
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
      
      // Le reste sera géré par le listener onAuthStateChange
      
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login error");
    }
  };

  // Nouvelle implémentation de logout utilisant l'edge function
  const logout = async () => {
    try {
      // Nettoyer d'abord le stockage local
      cleanupAuthState();
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      localStorage.removeItem("originalUser");
      
      // Appeler l'edge function pour la déconnexion
      await fetch(`${window.location.origin}/api/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession() ? (await supabase.auth.getSession()).data.session?.access_token || '' : ''}`
        },
        body: JSON.stringify({
          action: 'logout'
        })
      });
      
      // Nettoyage supplémentaire côté client
      await supabase.auth.signOut();
      setUserProfile(null);
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
