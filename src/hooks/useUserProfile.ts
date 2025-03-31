
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserProfile, Role } from "@/types/auth";

// Function to create a profile from user metadata
export const createProfileFromMetadata = (authUser: User | null): UserProfile | null => {
  if (!authUser) return null;
  
  // Récupérer le rôle depuis le localStorage en priorité pour éviter les rechargements inutiles
  const cachedRole = localStorage.getItem('userRole') as Role | null;
  const cachedUserId = localStorage.getItem('userId');
  
  // Si l'ID utilisateur correspond et que nous avons un rôle en cache, utilisons-le
  const role = (cachedUserId === authUser.id && cachedRole) 
    ? cachedRole 
    : (authUser.user_metadata?.role as Role) || 'editor';
  
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: authUser.user_metadata?.name || authUser.email || '',
    role: role,
    clientId: authUser.user_metadata?.clientId,
    wordpressConfigId: authUser.user_metadata?.wordpressConfigId,
  };
};

// Hook for user profile management with improved caching and error handling
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Function to fetch the full profile from the database
  const fetchFullProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log("Fetching full profile for user:", userId);
      
      // Utiliser d'abord le rôle en cache pour éviter tout problème
      const cachedRole = localStorage.getItem('userRole') as Role | null;
      const cachedUserId = localStorage.getItem('userId');
      
      // Si nous avons un profil utilisateur mais sans rôle défini, utilisons le rôle en cache
      if (userProfile && !userProfile.role && cachedRole && cachedUserId === userId) {
        console.log("Using cached role before fetch:", cachedRole);
        setUserProfile({...userProfile, role: cachedRole});
      }
      
      // Add a small retry mechanism for network issues
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*, wordpress_configs(name, site_url)')
            .eq('id', userId)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching profile:", error);
            throw error;
          }
          
          if (data) {
            console.log("Profile data received:", data);
            
            // Get cached role as fallback
            const roleToUse = data.role as Role || cachedRole || 'editor';
            
            const updatedProfile: UserProfile = {
              id: data.id,
              email: data.email,
              name: data.name,
              role: roleToUse,
              clientId: data.client_id,
              wordpressConfigId: data.wordpress_config_id,
              wordpressConfig: data.wordpress_configs ? {
                name: data.wordpress_configs.name,
                site_url: data.wordpress_configs.site_url
              } : null
            };
            
            console.log("Updated profile with role:", updatedProfile.role);
            setUserProfile(updatedProfile);
            
            // Cache the role for future reference
            localStorage.setItem('userRole', updatedProfile.role);
            localStorage.setItem('userId', updatedProfile.id);
            
            return true;
          }
          
          // No data but no error either - break the retry loop
          console.warn("No profile data found, using cached data if available");
          break;
        } catch (e) {
          console.error(`Attempt ${attempts + 1} failed:`, e);
          attempts++;
          
          // If we have more attempts, wait before retrying
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If we reach here without returning, we failed to get data
      console.warn("Could not fetch complete profile after retries");
      
      // Use the cached role if we have one
      if (cachedRole && cachedUserId === userId) {
        console.log("Using cached role after failed fetches:", cachedRole);
        
        // Update the current profile with the cached role
        if (userProfile) {
          const updatedProfile = {...userProfile, role: cachedRole};
          setUserProfile(updatedProfile);
          return true;
        }
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
