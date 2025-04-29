
import { useState, useEffect, useMemo } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useSupabaseConfig } from "../SupabaseConfigContext";
import { useLocation, useNavigate } from "react-router-dom";
import { hasRole } from "./types";
import { toast } from "sonner";
import { setSupabaseClient } from "@/integrations/supabase/client";

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = useState(
    location.pathname.includes('reset-password')
  );

  // Access Supabase client via context
  const { client: supabase, isLoading: isConfigLoading, error: configError } = useSupabaseConfig();

  // Update Supabase singleton when client is ready
  useEffect(() => {
    if (supabase) {
      setSupabaseClient(supabase);
    }
  }, [supabase]);

  // Derive authentication states
  const isAdmin = useMemo(() => hasRole(user, 'admin'), [user]);
  const isClient = useMemo(() => hasRole(user, 'client'), [user]);
  const isAuthenticated = useMemo(() => !!user && !!session, [user, session]);

  // Load current user and session
  useEffect(() => {
    // Skip if Supabase client isn't ready
    if (!supabase) {
      return;
    }

    setIsLoading(true);

    // Set up auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        console.log("User signed in:", session?.user);
        setUser(session?.user || null);
        setSession(session || null);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setUser(null);
        setSession(null);
        navigate('/login');
      } else if (event === "USER_UPDATED") {
        console.log("User profile updated:", session?.user);
        setUser(session?.user || null);
        setSession(session || null);
      } else if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery initiated");
        setIsOnResetPasswordPage(true);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setSession(session || null);
    }).finally(() => {
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, location.pathname, navigate]); 

  // Update reset password page state when location changes
  useEffect(() => {
    setIsOnResetPasswordPage(location.pathname.includes('reset-password'));
  }, [location.pathname]);

  // Login function
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Login error:", error);
      throw new Error(error.message);
    }

    console.log("Login successful:", data);
    setUser(data.user);
    setSession(data.session);
  };

  // Logout function
  const logout = async () => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      throw new Error(error.message);
    }

    console.log("Logout successful");
    setUser(null);
    setSession(null);
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      throw new Error(error.message);
    }

    console.log("Reset password request sent:", data);
    toast.success("A reset email has been sent.");
  };

  // Update password function
  const updatePassword = async (newPassword: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      throw new Error(error.message);
    }

    console.log("Password updated:", data);
    toast.success("Password successfully updated.");
  };

  return {
    user,
    session,
    isLoading: isLoading || isConfigLoading,
    isAuthenticated,
    isAdmin,
    isClient,
    isOnResetPasswordPage,
    configError,
    isConfigLoading,
    login,
    logout,
    resetPassword,
    updatePassword
  };
};
