
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

  // Fonction pour authentifier via la fonction Edge et se connecter avec le mot de passe sécurisé
  const authenticateAndSecurePassword = async (email: string, password: string) => {
    try {
      console.log("Envoi de la demande d'authentification sécurisée");
      const supabaseUrl = "https://rdwqedmvzicerwotjseg.supabase.co";
      
      // Afficher les détails de la requête pour le débogage
      console.log(`Appel à ${supabaseUrl}/functions/v1/secure-password avec:`, { email });
      
      const response = await fetch(`${supabaseUrl}/functions/v1/secure-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Log pour vérifier la réponse brute
      console.log("Statut de la réponse:", response.status);
      
      const data = await response.json();
      console.log("Réponse complète reçue:", data);
      
      if (!response.ok) {
        console.error("Échec de l'authentification:", data.error, data.details);
        throw new Error(data.error || "Identifiants invalides");
      }
      
      if (!data.securedPassword) {
        console.error("La réponse ne contient pas de mot de passe sécurisé");
        throw new Error("Erreur de sécurisation du mot de passe");
      }
      
      console.log("Authentification réussie et mot de passe renforcé");
      return data;
    } catch (error: any) {
      console.error("Erreur lors de l'authentification sécurisée:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Tentative de connexion avec:", email);
      
      // Nettoyage des états d'authentification précédents
      const cleanupAuthState = () => {
        try {
          // Supprimer tous les tokens Supabase du localStorage
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
              console.log("Suppression de la clé de stockage:", key);
              localStorage.removeItem(key);
            }
          });
          
          // Supprimer également du sessionStorage si utilisé
          Object.keys(sessionStorage || {}).forEach((key) => {
            if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
              sessionStorage.removeItem(key);
            }
          });
          
          console.log("Nettoyage d'état d'authentification terminé");
        } catch (err) {
          console.warn("Erreur lors du nettoyage des tokens:", err);
        }
      };
      
      // Nettoyer les états d'authentification précédents
      cleanupAuthState();
      
      // Tenter une déconnexion globale pour éviter tout état incohérent
      try {
        await supabase.auth.signOut({ scope: 'global' });
        console.log("Déconnexion globale effectuée avec succès");
      } catch (err) {
        console.warn("Erreur lors de la déconnexion globale:", err);
        // Continuer même si cela échoue
      }

      // Étape 1: Authentifier et récupérer le mot de passe sécurisé
      console.log("Étape 1: Authentification et récupération du mot de passe sécurisé");
      const authResult = await authenticateAndSecurePassword(email, password);
      
      if (!authResult || !authResult.success || !authResult.securedPassword) {
        throw new Error("Échec de l'authentification");
      }
      
      console.log("Étape 2: Authentification réussie, connexion avec mot de passe sécurisé");
      
      // Si l'authentification est réussie, connecter directement avec le mot de passe original
      // car la fonction edge a déjà vérifié que ce mot de passe est correct
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password // Utiliser le mot de passe original qui a été vérifié par la fonction edge
      });
      
      if (error) {
        console.error("Erreur lors de la connexion finale:", error);
        throw error;
      }
      
      console.log("Étape 3: Connexion réussie:", data.user?.email);
      toast.success("Connexion réussie");
      
      if (!data?.user) {
        throw new Error("L'utilisateur n'a pas été trouvé après connexion");
      }
      
      return data;
    } catch (error: any) {
      setIsLoading(false);
      console.error("Erreur de connexion:", error);
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
