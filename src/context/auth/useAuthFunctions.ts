
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";

export const useAuthFunctions = (
  userProfile: UserProfile | null, 
  setUserProfile: (profile: UserProfile | null) => void,
  setIsLoading: (loading: boolean) => void
) => {
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      // User will be set by the auth state change listener
    } catch (error: any) {
      setIsLoading(false);
      throw error; // Rethrow the error for handling in the Login component
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('lastAdminPath');
      sessionStorage.removeItem('lastAuthenticatedPath');
      
      await supabase.auth.signOut();
      setUserProfile(null);
      localStorage.removeItem("originalUser");
    } catch (error) {
      // Silence this error
    }
  };

  return {
    login,
    logout
  };
};
