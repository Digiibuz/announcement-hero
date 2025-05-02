
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createProfileFromMetadata } from '@/hooks/useUserProfile';
import { UserProfile } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

export const useSessionHandler = (
  supabase: any,
  setUser: (user: UserProfile | null) => void,
  setSession: (session: Session | null) => void,
  setIsLoading: (isLoading: boolean) => void,
  navigate: (path: string) => void,
  setIsOnResetPasswordPage: (isOnResetPasswordPage: boolean) => void,
  silenceAllErrors: () => () => void
) => {
  const location = useLocation();

  useEffect(() => {
    if (!supabase) return;

    setIsLoading(true);
    
    // Silence all errors at startup
    const restore = silenceAllErrors();

    // Block all error events
    const errorHandler = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      return true;
    };
    
    window.addEventListener('error', errorHandler, true);
    window.addEventListener('unhandledrejection', errorHandler, true);

    // Set up auth state change handler
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
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
      supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
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
        
        // Remove error listeners after a delay
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
      
      // Remove error listeners after a delay
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
  }, [supabase, location.pathname, navigate, setSession, setUser, setIsLoading, setIsOnResetPasswordPage, silenceAllErrors]);
};
