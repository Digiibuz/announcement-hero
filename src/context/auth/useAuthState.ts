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

// Fonction utilitaire pour bloquer toutes les erreurs console
function silenceAllErrors() {
  // Stocker les fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Désactiver complètement tous les logs
  console.error = function() {};
  console.warn = function() {};
  console.log = function() {};
  
  // Retourner une fonction pour restaurer
  return () => {
    setTimeout(() => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.log = originalConsoleLog;
    }, 1000);
  };
}

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
    if (!supabase) return;

    setIsLoading(true);
    
    // Silence toutes les erreurs au démarrage
    const restore = silenceAllErrors();

    // Bloquer tous les événements d'erreur
    const errorHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      return true;
    };
    
    window.addEventListener('error', errorHandler, true);
    window.addEventListener('unhandledrejection', errorHandler, true);

    // Set up auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
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
        restore();
        
        // Supprimer les écouteurs d'erreur après un délai
        setTimeout(() => {
          window.removeEventListener('error', errorHandler, true);
          window.removeEventListener('unhandledrejection', errorHandler, true);
        }, 1000);
      });
    } catch (error) {
      localStorage.setItem("auth_initial_session_error", JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Erreur lors de la récupération de la session"
      }));
      setIsLoading(false);
      restore();
      
      // Supprimer les écouteurs d'erreur après un délai
      setTimeout(() => {
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', errorHandler, true);
      }, 1000);
    }

    return () => {
      subscription.unsubscribe();
      restore();
      window.removeEventListener('error', errorHandler, true);
      window.removeEventListener('unhandledrejection', errorHandler, true);
    };
  }, [supabase, location.pathname, navigate, setSession, setUser, setIsOnResetPasswordPage]); 

  // Update reset password page state when location changes
  useEffect(() => {
    setIsOnResetPasswordPage(location.pathname.includes('reset-password'));
  }, [location.pathname, setIsOnResetPasswordPage]);

  // Login function
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    // Silence toutes les erreurs pendant l'authentification
    const restore = silenceAllErrors();
    
    try {
      localStorage.setItem("auth_login_attempt", JSON.stringify({
        email: email.substring(0, 2) + "..." + email.split("@")[1],
        timestamp: new Date().toISOString()
      }));
      
      // Bloquer tous les événements d'erreur pendant la connexion
      const errorHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        return true;
      };
      
      window.addEventListener('error', errorHandler, true);
      window.addEventListener('unhandledrejection', errorHandler, true);
      
      try {
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
        localStorage.setItem("auth_login_error_handled", JSON.stringify({
          message: "Identifiants invalides",
          timestamp: new Date().toISOString()
        }));
        
        throw new Error("Identifiants invalides");
      } finally {
        // Retirer les écouteurs d'erreur
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', errorHandler, true);
        restore();
      }
    } catch (error) {
      localStorage.setItem("auth_login_error_outer", JSON.stringify({
        message: "Erreur de connexion",
        timestamp: new Date().toISOString()
      }));
      restore();
      throw new Error("Identifiants invalides");
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
