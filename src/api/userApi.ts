
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Role } from "@/types/auth";
import { toast } from "sonner";

/**
 * Fetches all user profiles from the database
 */
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*, wordpress_configs(name, site_url)');
    
    if (profilesError) {
      throw profilesError;
    }
    
    // Format user profiles
    const processedUsers: UserProfile[] = profilesData.map(profile => {
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as Role, // Cast to Role type
        clientId: profile.client_id,
        wordpressConfigId: profile.wordpress_config_id || null,
        wordpressConfig: profile.wordpress_configs ? {
          name: profile.wordpress_configs.name,
          site_url: profile.wordpress_configs.site_url
        } : null,
        lastLogin: null
      };
    });
    
    return processedUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Sends a password reset email to the user
 */
export const resetUserPassword = async (email: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
};

/**
 * Updates a user profile in the database
 */
export const updateUserProfile = async (userId: string, userData: Partial<UserProfile>): Promise<void> => {
  try {
    // Mise à jour du profil dans la table profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        wordpress_config_id: userData.role === 'client' ? userData.wordpressConfigId : null
      })
      .eq('id', userId);
    
    if (profileError) {
      throw profileError;
    }
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

/**
 * Deletes a user profile from the database
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    // Delete the profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};
