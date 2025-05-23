
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile, Role } from "@/types/auth";

export const createProfileFromMetadata = (authUser: User | null): UserProfile | null => {
  if (!authUser) return null;
  
  const cachedRole = localStorage.getItem('userRole') as Role | null;
  const cachedUserId = localStorage.getItem('userId');
  
  const role = (cachedUserId === authUser.id && cachedRole) 
    ? cachedRole 
    : (authUser.user_metadata?.role as Role) || 'client';
  
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email || '',
    role: role,
    clientId: authUser.user_metadata?.clientId,
    wordpressConfigId: authUser.user_metadata?.wordpressConfigId,
  };
};

// Hook simplifié sans retry complexe
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchFullProfile = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching profile:", error);
        return false;
      }
      
      if (data) {
        const updatedProfile: UserProfile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as Role,
          clientId: data.client_id,
          wordpressConfigId: data.wordpress_config_id,
          wordpressConfig: data.wordpress_configs ? {
            name: data.wordpress_configs.name,
            site_url: data.wordpress_configs.site_url
          } : null
        };
        
        setUserProfile(updatedProfile);
        localStorage.setItem('userRole', updatedProfile.role);
        localStorage.setItem('userId', updatedProfile.id);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Exception while fetching profile:', error);
      return false;
    }
  };

  return { 
    userProfile, 
    setUserProfile, 
    fetchFullProfile 
  };
};
