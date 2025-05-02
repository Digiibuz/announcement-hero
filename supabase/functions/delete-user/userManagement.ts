
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { logger } from "./logger.ts";

/**
 * Deletes a user profile from the profiles table
 */
export async function deleteUserProfile(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  logger.log("Deleting profile for user:", userId);
  
  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    logger.error("Error deleting profile:", error.message);
    throw error;
  }
  
  logger.log("Profile deleted successfully");
}

/**
 * Deletes a user from Supabase authentication
 */
export async function deleteAuthUser(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  logger.log("Deleting user from auth:", userId);
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    logger.error("Error deleting auth user:", error.message);
    throw error;
  }
  
  logger.log("Auth user deleted successfully");
}
