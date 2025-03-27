
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile, Role } from "@/types/auth";

// Function to create a profile from user metadata
export const createProfileFromMetadata = (authUser: User | null): UserProfile | null => {
  if (!authUser) return null;
  
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email || '',
    role: (authUser.user_metadata?.role as Role) || 'editor',
    clientId: authUser.user_metadata?.clientId,
    wordpressConfigId: authUser.user_metadata?.wordpressConfigId,
  };
};

// Hook for user profile management
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Function to fetch the full profile from the database
  const fetchFullProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (data && !error) {
        setUserProfile({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as Role,
          clientId: data.client_id,
          // Ensuring we handle the case where wordpress_config_id doesn't exist in the returned data
          wordpressConfigId: data.wordpress_config_id || null,
        });
        return true;
      } else if (error) {
        console.error('Error fetching complete profile:', error);
        return false;
      }
    } catch (error) {
      console.error('Exception while fetching profile:', error);
      return false;
    }
    return false;
  };

  return { 
    userProfile, 
    setUserProfile, 
    fetchFullProfile 
  };
};
