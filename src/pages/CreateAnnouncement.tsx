
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
      return false;
    }

    try {
      // Get WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, username, password, rest_api_key')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) throw wpConfigError;
      if (!wpConfig) throw new Error("WordPress configuration not found");

      // Construct the WordPress API URL for posts
      const apiUrl = `${wpConfig.site_url}/wp-json/wp/v2/posts`;
      
      // Prepare post data
      const postData = {
        title: announcement.title,
        content: announcement.description,
        status: announcement.status === 'published' ? 'publish' : 
                announcement.status === 'scheduled' ? 'future' : 'draft',
        categories: [parseInt(wpCategoryId)],
        date: announcement.status === 'scheduled' ? announcement.publish_date : undefined
      };
      
      // Send request to WordPress
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wpConfig.rest_api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to publish to WordPress: ${errorData.message || response.statusText}`);
      }

      const responseData = await response.json();
      console.log("Published to WordPress successfully:", responseData);
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
      
      // Save to Supabase
      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();
      
      if (error) throw error;
      
      // If status is published or scheduled, try to publish to WordPress
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory) {
        await publishToWordPress(newAnnouncement, data.wordpressCategory);
      }
      
      toast.success("Annonce enregistrée avec succès");
      
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
