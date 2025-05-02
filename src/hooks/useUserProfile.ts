
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

// Hook for user profile management with improved caching and error handling
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Function to fetch the full profile from the database
  const fetchFullProfile = async (userId: string): Promise<boolean> => {
    try {
      // Utiliser d'abord le rôle en cache pour éviter tout problème
      const cachedRole = localStorage.getItem('userRole') as Role | null;
      const cachedUserId = localStorage.getItem('userId');
      
      // Si nous avons un profil utilisateur mais sans rôle défini, utilisons le rôle en cache
      if (userProfile && !userProfile.role && cachedRole && cachedUserId === userId) {
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
            throw error;
          }
          
          if (data) {
            // Get cached role as fallback
            const roleToUse = data.role as Role || cachedRole || 'client';
            
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
            
            setUserProfile(updatedProfile);
            
            // Cache the role for future reference
            localStorage.setItem('userRole', updatedProfile.role);
            localStorage.setItem('userId', updatedProfile.id);
            
            return true;
          }
          
          // No data but no error either - break the retry loop
          break;
        } catch (e) {
          attempts++;
          
          // If we have more attempts, wait before retrying
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If we reach here without returning, we failed to get data
      
      // Use the cached role if we have one
      if (cachedRole && cachedUserId === userId) {
        // Update the current profile with the cached role
        if (userProfile) {
          const updatedProfile = {...userProfile, role: cachedRole};
          setUserProfile(updatedProfile);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      // Silence les erreurs pour éviter l'affichage dans la console
      return false;
    }
  };

  return { 
    userProfile, 
    setUserProfile, 
    fetchFullProfile 
  };
};
