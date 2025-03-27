import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const publishToWordPress = async (announcement: any, wpCategoryId: string) => {
    if (!user?.wordpressConfigId) {
      console.error("No WordPress configuration found for this user");
      toast.error("Configuration WordPress introuvable pour cet utilisateur");
      return false;
    }

    try {
      console.log("Récupération de la configuration WordPress...");
      
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, username, password, rest_api_key')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Erreur lors de la récupération de la configuration WordPress:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("Configuration WordPress non trouvée");
        throw new Error("WordPress configuration not found");
      }

      console.log("Configuration WordPress récupérée:", {
        site_url: wpConfig.site_url,
        hasRestApiKey: !!wpConfig.rest_api_key,
      });

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;
      
      // Construct the WordPress API URL for posts
      const apiUrl = `${siteUrl}/wp-json/wp/v2/posts`;
      console.log("URL de l'API WordPress:", apiUrl);
      
      // Format the content correctly
      const content = announcement.description || "";
      
      // Determine publication status
      let status = 'draft';
      if (announcement.status === 'published') {
        status = 'publish';
      } else if (announcement.status === 'scheduled' && announcement.publish_date) {
        status = 'future';
      }
      
      // Prepare post data
      const postData = {
        title: announcement.title,
        content: content,
        status: status,
        categories: [parseInt(wpCategoryId)],
        date: announcement.status === 'scheduled' ? announcement.publish_date : undefined
      };
      
      console.log("Données de la publication:", {
        title: postData.title,
        status: postData.status,
        categoryId: wpCategoryId,
        hasDate: !!postData.date
      });
      
      // Prepare headers with authentication
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Use REST API key if available, otherwise fall back to Basic Auth
      if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else if (wpConfig.username && wpConfig.password) {
        // Basic auth should be in format: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.username}:${wpConfig.password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        throw new Error("No authentication method available for WordPress");
      }
      
      console.log("Envoi de la requête à WordPress...");
      
      // Send request to WordPress
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(postData)
      });

      console.log("Statut de la réponse:", response.status);
      
      const responseText = await response.text();
      console.log("Réponse texte:", responseText);
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Not JSON, keep as text
        responseData = responseText;
      }

      if (!response.ok) {
        console.error("Erreur de publication WordPress:", responseData);
        throw new Error(`Failed to publish to WordPress: ${response.status} ${response.statusText}`);
      }

      console.log("Publication WordPress réussie:", responseData);
      toast.success("Publication WordPress réussie!");
      return true;
    } catch (error: any) {
      console.error("Error publishing to WordPress:", error);
      toast.error("Erreur lors de la publication WordPress: " + error.message);
      return false;
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the announcement data
      const announcementData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status || "draft",
        images: data.images || [],
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null
      };
      
      console.log("Enregistrement de l'annonce:", announcementData);
      
      // Save to Supabase
      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Annonce enregistrée dans Supabase:", newAnnouncement);
      
      // If status is published or scheduled, try to publish to WordPress
      let wordpressSuccess = true;
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory) {
        console.log("Tentative de publication sur WordPress...");
        wordpressSuccess = await publishToWordPress(newAnnouncement, data.wordpressCategory);
      }
      
      if (wordpressSuccess) {
        toast.success("Annonce enregistrée avec succès");
      } else {
        toast.warning("Annonce enregistrée dans la base de données, mais la publication WordPress a échoué");
      }
      
      // Redirect to the announcements list
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <div className="max-w-4xl mx-auto">
              <AnnouncementForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default CreateAnnouncement;
