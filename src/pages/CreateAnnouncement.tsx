
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import SiteConnectionStatus from "@/components/wordpress/SiteConnectionStatus";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";

const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToWordPress, isPublishing } = useWordPressPublishing();

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
      let wordpressResult = { success: true, message: "" };
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        console.log("Tentative de publication sur WordPress...");
        wordpressResult = await publishToWordPress(
          newAnnouncement as Announcement, 
          data.wordpressCategory,
          user.id
        );
      }
      
      if (wordpressResult.success) {
        toast.success("Annonce enregistrée avec succès");
      } else {
        toast.warning("Annonce enregistrée dans la base de données, mais la publication WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"));
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
              {/* Ajout du composant de statut de connexion WordPress */}
              <SiteConnectionStatus />
              
              <AnnouncementForm 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting || isPublishing} 
              />
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default CreateAnnouncement;
