
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserProfile, createProfileFromMetadata } from "@/hooks/useUserProfile";
import { UserProfile, AuthContextType } from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, setUserProfile, fetchFullProfile } = useUserProfile();

  // Très simple gestion d'auth - pas de détection de changement de fenêtre
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const initialProfile = createProfileFromMetadata(session.user);
          setUserProfile(initialProfile);
          fetchFullProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Get initial session - une seule fois
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
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

  const value: AuthContextType = {
    user: userProfile,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile,
    isAdmin: userProfile?.role === "admin",
    isClient: userProfile?.role === "client",
    impersonateUser: () => {}, // Désactivé pour simplifier
    stopImpersonating: () => {}, // Désactivé pour simplifier
    originalUser: null,
    isImpersonating: false,
    isOnResetPasswordPage: false, // Supprimé la détection complexe
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
