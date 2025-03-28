
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "@/types/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Create authenticated Supabase client
    const supabase = createServerSupabaseClient<Database>({ req, res });
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.query;
    const { wordpressPostId, userId } = req.body;

    if (!wordpressPostId || !userId) {
      return res.status(400).json({ message: "WordPress post ID and user ID are required" });
    }

    // Get WordPress config from the user's profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wordpress_config_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return res.status(500).json({ message: "Error fetching user profile" });
    }

    if (!userProfile?.wordpress_config_id) {
      return res.status(400).json({ message: "User has no WordPress configuration" });
    }
    
    // Get WordPress config
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('site_url, app_username, app_password')
      .eq('id', userProfile.wordpress_config_id)
      .single();

    if (wpConfigError) {
      console.error("Error fetching WordPress config:", wpConfigError);
      return res.status(500).json({ message: "Error fetching WordPress configuration" });
    }
    
    if (!wpConfig) {
      return res.status(404).json({ message: "WordPress configuration not found" });
    }

    // Ensure site_url has proper format
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;
    
    // Construct the WordPress API URL for posts
    const apiUrl = `${siteUrl}/wp-json/wp/v2/posts/${wordpressPostId}`;
    
    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Check for authentication credentials
    if (wpConfig.app_username && wpConfig.app_password) {
      // Application Password Format: "Basic base64(username:password)"
      const basicAuth = Buffer.from(`${wpConfig.app_username}:${wpConfig.app_password}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    } else {
      return res.status(400).json({ message: "No WordPress authentication method available" });
    }
    
    // Send DELETE request to WordPress
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("WordPress deletion error:", responseText);
      return res.status(response.status).json({ 
        message: `Failed to delete from WordPress: ${response.statusText}`,
        details: responseText
      });
    }

    // Clear WordPress post ID from the announcement
    await supabase
      .from('announcements')
      .update({ wordpress_post_id: null })
      .eq('id', id);
    
    return res.status(200).json({ message: "WordPress post deleted successfully" });
    
  } catch (error: any) {
    console.error("Error deleting WordPress post:", error);
    return res.status(500).json({ message: error.message || "An error occurred" });
  }
}
