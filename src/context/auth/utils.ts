
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/types/auth";

// Helper function to create a profile from user metadata
export const createProfileFromMetadata = (user: User): UserProfile => {
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    role: user.user_metadata?.role || 'client',
    clientId: user.user_metadata?.client_id,
    wordpressConfigId: user.user_metadata?.wordpress_config_id,
    wordpressConfig: null,
    lastLogin: user.last_sign_in_at || null,
  };
};
