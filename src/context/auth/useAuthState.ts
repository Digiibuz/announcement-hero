
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  getSupabaseClient,
  supabase,
  setSupabaseClient,
  SENSITIVE_PATTERNS
} from '@/integrations/supabase/client';
import { safeConsoleError } from '@/utils/logSanitizer';
import { handleAuthError } from '@/utils/security';
import { UserProfile } from '@/types/auth';
import { createProfileFromMetadata } from '@/hooks/useUserProfile';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';
import { hasRole } from './types';

export const useAuthState = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
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

    // Bloquer les logs pendant l'authentification
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Désactiver temporairement les logs pour éviter de montrer les URLs sensibles
    console.error = function(...args) {
      // Bloquer les logs contenant des informations sensibles
      if (args.some(arg => {
        if (arg === null || arg === undefined) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return;
      }
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      if (args.some(arg => {
        if (arg === null || arg === undefined) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return;
      }
      originalConsoleWarn.apply(console, args);
    };
    
    console.log = function(...args) {
      if (args.some(arg => {
        if (arg === null || arg === undefined) return false;
        const str = String(arg);
        return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
      })) {
        return;
      }
      originalConsoleLog.apply(console, args);
    };

    // Set up auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Utiliser un log sécurisé
        safeConsoleError("User signed in:", session?.user?.id);
        setUser(createProfileFromMetadata(session?.user || null));
        setSession(session || null);
      } else if (event === "SIGNED_OUT") {
        safeConsoleError("User signed out");
        setUser(null);
        setSession(null);
        navigate('/login');
      } else if (event === "USER_UPDATED") {
        safeConsoleError("User profile updated:", session?.user?.id);
        setUser(createProfileFromMetadata(session?.user || null));
        setSession(session || null);
      } else if (event === "PASSWORD_RECOVERY") {
        safeConsoleError("Password recovery initiated");
        setIsOnResetPasswordPage(true);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(createProfileFromMetadata(session?.user || null));
      setSession(session || null);
    }).finally(() => {
      setIsLoading(false);
      
      // Restaurer les fonctions de console
      setTimeout(() => {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      
      // Restaurer les fonctions de console
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
  }, [supabase, location.pathname, navigate]); 

  // Update reset password page state when location changes
  useEffect(() => {
    setIsOnResetPasswordPage(location.pathname.includes('reset-password'));
  }, [location.pathname]);

  // Login function
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    // Bloquer les logs pendant l'authentification
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    
    // Désactiver temporairement tous les logs
    console.error = function() {};
    console.warn = function() {};
    console.log = function() {};
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        // Ne pas loguer l'erreur complète, utiliser un message générique
        throw new Error("Identifiants invalides");
      }

      setUser(createProfileFromMetadata(data.user));
      setSession(data.session);
    } catch (error) {
      // Utiliser un message d'erreur générique pour ne pas exposer de détails
      throw new Error("Identifiants invalides");
    } finally {
      // Restaurer les fonctions de console après un délai
      setTimeout(() => {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
      }, 1000);
    }
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
