
import { User } from "@supabase/supabase-js";
import { UserProfile, Role } from "@/types/auth";
import { supabase } from "@/integrations/supabase/client";

// Helper function to create a UserProfile from a Supabase User object
export const createProfileFromMetadata = (user: User | null): UserProfile | null => {
  if (!user) return null;

  // Extract user metadata
  const metadata = user.user_metadata || {};
  
  // Determine role from metadata or default to "client"
  let role: Role = (metadata.role as Role) || "client";
  
  // Ensure role is a valid Role type
  if (!["admin", "client", "user"].includes(role)) {
    role = "client";
  }

  // Build the UserProfile object
  const profile: UserProfile = {
    id: user.id,
    email: user.email || "",
    name: metadata.name || user.email?.split('@')[0] || "User",
    role: role,
    clientId: metadata.client_id || undefined,
    wordpressConfigId: metadata.wordpress_config_id || undefined,
    lastLogin: user.last_sign_in_at || null
  };

  if (metadata.wordpress_config) {
    profile.wordpressConfig = {
      name: metadata.wordpress_config.name || "",
      site_url: metadata.wordpress_config.site_url || "",
    };
  }

  return profile;
};

// Function to get user profile data
export const useUserProfile = () => {
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  };
  
  return { fetchProfile };
};

export default useUserProfile;
