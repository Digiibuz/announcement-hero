import { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

export const useUserProfile = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, wordpress_configs(name, site_url)')
          .eq('id', userId)
          .single();
        
        if (error) {
          setError(error);
          console.error("Error fetching user profile:", error);
          toast.error("Erreur lors de la récupération du profil utilisateur");
          return;
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
        }
      } catch (err: any) {
        setError(err);
        console.error("Unexpected error fetching user profile:", err);
        toast.error("Erreur inattendue lors de la récupération du profil utilisateur");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return { userProfile, isLoading, error };
};
