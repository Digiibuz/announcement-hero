
import React from "react";
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

  const handleSubmit = async (data: any) => {
    try {
      // Prepare the announcement data
      const announcementData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status || "draft",
        images: data.images || [],
      };
      
      // Save to Supabase
      const { data: newAnnouncement, error } = await supabase
        .from("announcements")
        .insert(announcementData)
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Annonce enregistrée avec succès");
      
      // Redirect to the announcements list
      navigate("/announcements");
    } catch (error: any) {
      console.error("Error saving announcement:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
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
              <AnnouncementForm onSubmit={handleSubmit} />
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default CreateAnnouncement;
