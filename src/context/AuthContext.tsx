
import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Role } from "@/types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isClient: boolean;
  isCommercial: boolean;
  login: (email: string, password: string) => Promise<{ error?: any }>;
  logout: () => void;
  impersonateUser: (targetUser: UserProfile) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
  originalUser: UserProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);

  const loadSession = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, wordpress_configs(name, site_url)')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: profile.name,
          role: profile.role as Role,
          clientId: profile.client_id,
          wordpressConfigId: profile.wordpress_config_id || null,
          wordpressConfig: profile.wordpress_configs ? {
            name: profile.wordpress_configs.name,
            site_url: profile.wordpress_configs.site_url
          } : null,
          lastLogin: session.user.last_sign_in_at,
          appVersion: profile.app_version || null,
        });
      }
    } catch (error: any) {
      console.error("Error loading session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    // Listen for changes on auth state (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        loadSession();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        return { error };
      }

      // After successful login, load the user session to update the user state
      await loadSession();
      return { data };
    } catch (error: any) {
      console.error("Login failed:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error: any) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const impersonateUser = async (targetUser: UserProfile) => {
    setIsImpersonating(true);
    setOriginalUser(user);
    setUser(targetUser);
  };

  const stopImpersonation = async () => {
    setIsImpersonating(false);
    setUser(originalUser);
    setOriginalUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    isCommercial: user?.role === 'commercial',
    login,
    logout,
    impersonateUser,
    stopImpersonation,
    isImpersonating,
    originalUser
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
