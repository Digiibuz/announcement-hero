
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();
  const { originalUser, isImpersonating, impersonateUser: hookImpersonateUser, stopImpersonating: hookStopImpersonating } = useImpersonation(userProfile);

  // Détection si nous sommes sur la page de réinitialisation avec token
  const isOnResetPasswordPage = window.location.pathname === '/reset-password' && 
    (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token'));

  // Gestion d'auth - pas de détection de changement de fenêtre
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Si nous sommes sur la page de reset password avec un token de récupération,
        // on ne met pas à jour le profil utilisateur normal
        if (isOnResetPasswordPage && event === 'SIGNED_IN') {
          console.log('On reset password page with recovery token, skipping profile update');
          setIsLoading(false);
          return;
        }

        if (session?.user && !isOnResetPasswordPage) {
          const initialProfile = createProfileFromMetadata(session.user);
          setUserProfile(initialProfile);
          fetchFullProfile(session.user.id);
        } else if (!isOnResetPasswordPage) {
          setUserProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Get initial session - une seule fois
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !isOnResetPasswordPage) {
        const initialProfile = createProfileFromMetadata(session.user);
        setUserProfile(initialProfile);
        fetchFullProfile(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    } catch (error: any) {
      setIsLoading(false);
      throw new Error(error.message || "Login error");
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = hookImpersonateUser(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
    }
  };

  const stopImpersonating = () => {
    const originalUserData = hookStopImpersonating();
    if (originalUserData) {
      setUserProfile(originalUserData);
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
