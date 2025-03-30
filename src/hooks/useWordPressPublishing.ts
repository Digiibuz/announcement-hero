import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";

export const useWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);

  const publishToWordPress = async (
    announcement: Announcement, 
    categoryId: string, 
    userId: string,
    isPage: boolean = false
  ) => {
    try {
      setIsPublishing(true);
      
      // 1. Get the WordPress config for the user
      const { data: userProfile, error: userError } = await supabase
        .from("profiles")
        .select("wordpressConfigId")
        .eq("id", userId)
        .single();
        
      if (userError) throw new Error("Erreur lors de la récupération de la configuration WordPress");
      if (!userProfile.wordpressConfigId) throw new Error("Aucune configuration WordPress définie pour cet utilisateur");
      
      // 2. Get the WordPress credentials
      const { data: wpConfig, error: wpError } = await supabase
        .from("wordpress_configs")
        .select("*")
        .eq("id", userProfile.wordpressConfigId)
        .single();
        
      if (wpError) throw new Error("Erreur lors de la récupération des informations de connexion WordPress");
      
      // 3. Prepare the data for WordPress
      const postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === "published" ? "publish" : "draft",
        featured_media: announcement.images && announcement.images.length > 0 ? announcement.images[0] : null,
        categories: [parseInt(categoryId)],
        date: announcement.publish_date || new Date().toISOString(),
        slug: announcement.seo_slug || undefined,
        excerpt: announcement.seo_description || "",
        meta: {
          _aioseop_title: announcement.seo_title || "",
          _aioseop_description: announcement.seo_description || "",
        }
      };
      
      // 4. Determine the endpoint based on whether it's a page or post
      const endpoint = isPage ? 
        `${wpConfig.site_url}/wp-json/wp/v2/pages` : 
        `${wpConfig.site_url}/wp-json/wp/v2/posts`;
      
      console.log(`Posting to WordPress ${isPage ? 'page' : 'post'} API:`, endpoint);
      
      // 5. Send to WordPress
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${wpConfig.username}:${wpConfig.password}`)}`
        },
        body: JSON.stringify(postData)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("WordPress API error:", responseData);
        throw new Error(`Erreur de l'API WordPress: ${responseData.message || "Erreur inconnue"}`);
      }
      
      console.log(`${isPage ? 'Page' : 'Article'} publié sur WordPress avec succès:`, responseData);
      
      return {
        success: true,
        message: "Publication réussie",
        wordpressPostId: responseData.id
      };
      
    } catch (error: any) {
      console.error(`Erreur lors de la publication sur WordPress (${isPage ? 'page' : 'post'}):`, error);
      return {
        success: false,
        message: error.message,
        wordpressPostId: null
      };
    } finally {
      setIsPublishing(false);
    }
  };
  
  return { publishToWordPress, isPublishing };
};
