
import { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

// Helper function to create a profile from user metadata
export const createProfileFromMetadata = (user: User): UserProfile => {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'client',
    clientId: user.user_metadata?.client_id || undefined,
    wordpressConfigId: user.user_metadata?.wordpress_config_id || undefined,
    wordpressConfig: null,
    lastLogin: user.last_sign_in_at || null,
  };
};

export const useUserProfile = (userId?: string) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch a user's full profile with additional data
  const fetchFullProfile = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)')
        .eq('id', id)
        .single();
      
      if (error) {
        setError(error);
        console.error("Error fetching user profile:", error);
        toast.error("Erreur lors de la récupération du profil utilisateur");
        return false;
      }
      
      if (data) {
        // Check if profile.wordpress_configs exists and has name/site_url properties
        let wordpressConfig = null;
        if (data.wordpress_configs) {
          // Handle potential SelectQueryError
          const wpConfig = data.wordpress_configs as any;
          if (wpConfig && typeof wpConfig === 'object' && 'name' in wpConfig && 'site_url' in wpConfig) {
            wordpressConfig = {
              name: String(wpConfig.name),
              site_url: String(wpConfig.site_url)
            };
          }
        }

        const typedProfile: UserProfile = {
          id: typedData<string>(data.id),
          email: typedData<string>(data.email),
          name: typedData<string>(data.name),
          role: typedData<"admin" | "client">(data.role),
          clientId: typedData<string>(data.client_id),
          wordpressConfigId: typedData<string>(data.wordpress_config_id) || null,
          wordpressConfig: wordpressConfig,
          lastLogin: typedData<string>(data.last_login) || null,
        };
        
        setUserProfile(typedProfile);
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err);
      console.error("Unexpected error fetching user profile:", err);
      toast.error("Erreur inattendue lors de la récupération du profil utilisateur");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFullProfile(userId);
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  return { userProfile, isLoading, error, setUserProfile, fetchFullProfile };
};
