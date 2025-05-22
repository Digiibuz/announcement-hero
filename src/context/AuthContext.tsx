
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

  // Fonction pour authentifier via la fonction Edge
  const authenticateAndSecurePassword = async (email: string, password: string) => {
    try {
      console.log("Vérification des identifiants via la fonction edge sécurisée");
      const supabaseUrl = "https://rdwqedmvzicerwotjseg.supabase.co";
      
      // Appel à la fonction edge pour vérifier les identifiants originaux et obtenir un mot de passe sécurisé
      console.log(`Appel à ${supabaseUrl}/functions/v1/secure-password avec email: ${email}`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/secure-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Échec de l'authentification:", errorData);
        throw new Error(errorData.error || "Identifiants invalides");
      }
      
      const data = await response.json();
      console.log("Réponse de l'authentification sécurisée:", { 
        success: data.success, 
        userExists: !!data.user 
      });
      
      if (!data.success || !data.user) {
        console.error("La réponse ne contient pas d'informations d'utilisateur valides");
        throw new Error("Erreur lors de l'authentification");
      }
      
      console.log("Authentification sécurisée réussie");
      return data;
    } catch (error: any) {
      console.error("Erreur lors de l'authentification sécurisée:", error);
      throw error;
    }
  };

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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Tentative de connexion avec:", email);
      
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

      // Pour les nouveaux utilisateurs, contourner la vérification edge et essayer directement
      console.log("Tentative de connexion directe avec le mot de passe original");
      
      // Connexion directe avec le client Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Erreur lors de la connexion directe:", error);
        
        // Si l'erreur n'est pas "Invalid login credentials", la propager
        if (!error.message.includes("Invalid login credentials")) {
          throw error;
        }
        
        // Sinon, essayer la méthode secure-password comme fallback
        console.log("Tentative avec secure-password comme fallback");
        const authResult = await authenticateAndSecurePassword(email, password);
        
        if (!authResult || !authResult.success || !authResult.user) {
          throw new Error("Échec de l'authentification");
        }
        
        // Se connecter avec le mot de passe original
        const { data: secureData, error: secureError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (secureError) {
          console.error("Erreur lors de la connexion sécurisée:", secureError);
          throw secureError;
        }
        
        console.log("Connexion réussie via le fallback secure-password");
        toast.success("Connexion réussie");
        
        return secureData;
      }
      
      // Connexion directe réussie
      console.log("Connexion directe réussie:", data.user?.email);
      toast.success("Connexion réussie");
      
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
