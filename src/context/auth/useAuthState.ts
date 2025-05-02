
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
import { usePersistedState } from '@/hooks/usePersistedState';

export const useAuthState = () => {
  const [user, setUser] = usePersistedState<UserProfile | null>("auth_user", null);
  const [session, setSession] = usePersistedState<Session | null>("auth_session", null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isOnResetPasswordPage, setIsOnResetPasswordPage] = usePersistedState(
    "auth_is_on_reset_password_page",
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
        // Stocker silencieusement l'information
        localStorage.setItem("auth_state_change", JSON.stringify({
          event: "SIGNED_IN",
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        }));
        
        setUser(createProfileFromMetadata(session?.user || null));
        setSession(session || null);
      } else if (event === "SIGNED_OUT") {
        localStorage.setItem("auth_state_change", JSON.stringify({
          event: "SIGNED_OUT",
          timestamp: new Date().toISOString()
        }));
        
        setUser(null);
        setSession(null);
        navigate('/login');
      } else if (event === "USER_UPDATED") {
        localStorage.setItem("auth_state_change", JSON.stringify({
          event: "USER_UPDATED",
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        }));
        
        setUser(createProfileFromMetadata(session?.user || null));
        setSession(session || null);
      } else if (event === "PASSWORD_RECOVERY") {
        localStorage.setItem("auth_state_change", JSON.stringify({
          event: "PASSWORD_RECOVERY",
          timestamp: new Date().toISOString()
        }));
        
        setIsOnResetPasswordPage(true);
      }
    });

    // Get initial session
    try {
      supabase.auth.getSession().then(({ data: { session } }) => {
        localStorage.setItem("auth_initial_session", JSON.stringify({
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        }));
        
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
    } catch (error) {
      localStorage.setItem("auth_initial_session_error", 
        error instanceof Error ? error.message : "Erreur inconnue");
      setIsLoading(false);
      
      // Restaurer les fonctions de console
      setTimeout(() => {
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.log = originalConsoleLog;
      }, 1000);
    }

    return () => {
      subscription.unsubscribe();
      
      // Restaurer les fonctions de console
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    };
  }, [supabase, location.pathname, navigate, setSession, setUser, setIsOnResetPasswordPage]); 

  // Update reset password page state when location changes
  useEffect(() => {
    setIsOnResetPasswordPage(location.pathname.includes('reset-password'));
  }, [location.pathname, setIsOnResetPasswordPage]);

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
      localStorage.setItem("auth_login_attempt", JSON.stringify({
        email: email.substring(0, 2) + "..." + email.split("@")[1],
        timestamp: new Date().toISOString()
      }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        localStorage.setItem("auth_login_error", JSON.stringify({
          message: "Identifiants invalides",
          timestamp: new Date().toISOString()
        }));
        
        throw new Error("Identifiants invalides");
      }

      localStorage.setItem("auth_login_success", JSON.stringify({
        userId: data.user?.id,
        timestamp: new Date().toISOString()
      }));
      
      setUser(createProfileFromMetadata(data.user));
      setSession(data.session);
    } catch (error) {
      // Utiliser un message d'erreur générique pour ne pas exposer de détails
      localStorage.setItem("auth_login_error_handled", JSON.stringify({
        message: "Identifiants invalides",
        timestamp: new Date().toISOString()
      }));
      
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
    
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        localStorage.setItem("auth_logout_error", JSON.stringify({
          message: error.message,
          timestamp: new Date().toISOString()
        }));
        
        throw new Error(error.message);
      }

      localStorage.setItem("auth_logout_success", JSON.stringify({
        timestamp: new Date().toISOString()
      }));
      
      setUser(null);
      setSession(null);
    } catch (error) {
      localStorage.setItem("auth_logout_error_handled", JSON.stringify({
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString()
      }));
      
      throw new Error("Erreur lors de la déconnexion");
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    try {
      localStorage.setItem("auth_reset_password_attempt", JSON.stringify({
        email: email.substring(0, 2) + "..." + email.split("@")[1],
        timestamp: new Date().toISOString()
      }));
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        localStorage.setItem("auth_reset_password_error", JSON.stringify({
          message: error.message,
          timestamp: new Date().toISOString()
        }));
        
        throw new Error(error.message);
      }

      localStorage.setItem("auth_reset_password_success", JSON.stringify({
        timestamp: new Date().toISOString()
      }));
      
      toast.success("Un email de réinitialisation a été envoyé.");
    } catch (error) {
      localStorage.setItem("auth_reset_password_error_handled", JSON.stringify({
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString()
      }));
      
      throw new Error("Erreur lors de l'envoi de l'email de réinitialisation");
    }
  };

  // Update password function
  const updatePassword = async (newPassword: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    try {
      localStorage.setItem("auth_update_password_attempt", JSON.stringify({
        timestamp: new Date().toISOString()
      }));
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        localStorage.setItem("auth_update_password_error", JSON.stringify({
          message: error.message,
          timestamp: new Date().toISOString()
        }));
        
        throw new Error(error.message);
      }

      localStorage.setItem("auth_update_password_success", JSON.stringify({
        userId: data.user?.id,
        timestamp: new Date().toISOString()
      }));
      
      toast.success("Mot de passe mis à jour avec succès.");
    } catch (error) {
      localStorage.setItem("auth_update_password_error_handled", JSON.stringify({
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString()
      }));
      
      throw new Error("Erreur lors de la mise à jour du mot de passe");
    }
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
