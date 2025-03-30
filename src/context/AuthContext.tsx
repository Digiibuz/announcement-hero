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

  useEffect(() => {
    console.log("Auth context effect running - initializing auth state");
    let isMounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        console.log(`Auth state changed: ${event}`, currentSession?.user?.id);
        
        if (currentSession?.user) {
          setSession(currentSession);
          const initialProfile = createProfileFromMetadata(currentSession.user);
          setUserProfile(initialProfile);
          
          if (isMounted) {
            fetchFullProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setSession(null);
        }
        
        setIsLoading(false);
      }
    );

    const initializeAuth = async () => {
      try {
        console.log("Checking for existing session");
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession?.user && isMounted) {
          console.log("Existing session found:", existingSession.user.id);
          setSession(existingSession);
          
          const initialProfile = createProfileFromMetadata(existingSession.user);
          setUserProfile(initialProfile);
          
          fetchFullProfile(existingSession.user.id);
        } else {
          console.log("No existing session found");
          if (isMounted) setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("Tab became visible - checking session");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log("Session still valid after visibility change");
          setSession(currentSession);
          
          if (!userProfile || userProfile.id !== currentSession.user.id) {
            console.log("Updating user profile after visibility change");
            const initialProfile = createProfileFromMetadata(currentSession.user);
            setUserProfile(initialProfile);
            fetchFullProfile(currentSession.user.id);
          }
        } else if (session) {
          console.log("Session lost after visibility change");
          setSession(null);
          setUserProfile(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      setSession(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const impersonateUser = (userToImpersonate: UserProfile) => {
    const impersonatedUser = startImpersonation(userToImpersonate);
    if (impersonatedUser) {
      setUserProfile(impersonatedUser);
    }
  };

  const stopImpersonating = () => {
    const originalUserProfile = endImpersonation();
    if (originalUserProfile) {
      setUserProfile(originalUserProfile);
    }
  };

  const value: AuthContextType = {
    user: userProfile,
    session,
    isLoading,
    login,
    logout,
    isAuthenticated: !!userProfile && !!session,
    isAdmin: userProfile?.role === "admin",
    isEditor: userProfile?.role === "editor",
    isClient: userProfile?.role === "client",
    impersonateUser,
    stopImpersonating,
    originalUser,
    isImpersonating,
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
