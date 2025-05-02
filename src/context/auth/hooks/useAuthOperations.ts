
import { toast } from 'sonner';
import { UserProfile } from '@/types/auth';
import { createProfileFromMetadata } from '@/hooks/useUserProfile';
import { createTemporaryErrorHandler, silenceAllErrors } from './authSecurityUtils';

export const useAuthOperations = (
  supabase: any | null,
  setUser: (user: UserProfile | null) => void,
  setSession: (session: any | null) => void
) => {
  // Login function
  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    // Silence all errors during authentication
    const restore = silenceAllErrors();
    
    try {
      localStorage.setItem("auth_login_attempt", JSON.stringify({
        email: email.substring(0, 2) + "..." + email.split("@")[1],
        timestamp: new Date().toISOString()
      }));
      
      // Create and install temporary error handler
      const errorHandler = createTemporaryErrorHandler();
      errorHandler.install();
      
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
        // Remove temporary error handlers
        errorHandler.remove();
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
    login,
    logout,
    resetPassword,
    updatePassword
  };
};
