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
    // Check for internet connection
    if (!window.navigator.onLine) {
      throw new Error("Pas de connexion internet");
    }
    
    // Get current URL origin for proper redirect
    const origin = window.location.origin;
    const redirectTo = `${origin}/reset-password`;
    
    console.log(`Sending password reset with redirect to: ${redirectTo}`);
    
    const { error } = await Promise.race([
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      }),
      // Add timeout to detect slow connections
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Délai d'attente dépassé")), 10000);
      })
    ]) as any;
    
    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error("Error resetting password:", error);
    
    // Handle specific error cases
    if (error.message === "Délai d'attente dépassé") {
      throw new Error("Le serveur met trop de temps à répondre. Veuillez réessayer plus tard.");
    } else if (error.message?.includes('network') || !window.navigator.onLine) {
      throw new Error("Problème de connexion réseau. Veuillez vérifier votre connexion internet.");
    }
    
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
