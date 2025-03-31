
"use client"

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementForm from "@/components/announcements/AnnouncementForm";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { toast } from "@/hooks/use-toast";
import { DiviPixelPage } from "@/types/announcement";
import { useDiviPixelPublishing } from "@/hooks/useDiviPixelPublishing";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

const CreateDiviPixelPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { publishToDiviPixel, isPublishing } = useDiviPixelPublishing();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Préparer les données de la page DiviPixel
      const diviPixelPageData = {
        user_id: user?.id,
        title: data.title,
        meta_description: data.seoDescription || null,
        status: data.status as "draft" | "published" | "scheduled",
        organization_pixels: {}, // Structure vide par défaut
        components_used: [], // Liste vide par défaut
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null,
        seo_title: data.seoTitle || null,
        seo_slug: data.seoSlug || null
      };
      console.log("Enregistrement de la page DiviPixel:", diviPixelPageData);

      // Sauvegarder dans Supabase
      const { data: newDiviPixelPage, error } = await supabase
        .from("divipixel_pages")
        .insert(diviPixelPageData)
        .select()
        .single();

      if (error) throw error;
      console.log("Page DiviPixel enregistrée dans Supabase:", newDiviPixelPage);

      // Si le statut est publié ou programmé, essayer de publier sur WordPress
      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        console.log("Tentative de publication sur WordPress...");
        wordpressResult = await publishToDiviPixel(newDiviPixelPage as DiviPixelPage, data.wordpressCategory, user.id);
        console.log("Résultat de la publication WordPress:", wordpressResult);
      }
      
      if (wordpressResult.success) {
        toast({
          title: "Succès",
          description: "Page DiviPixel enregistrée avec succès"
        });
      } else {
        toast({
          title: "Attention",
          description: "Page DiviPixel enregistrée dans la base de données, mais la publication WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"),
          variant: "destructive"
        });
      }

      // Rediriger vers la liste des pages DiviPixel (à créer)
      navigate("/divipixel-pages");
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de la page DiviPixel:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout 
      title="Créer une nouvelle page DiviPixel" 
      titleAction={
        <Button variant="outline" size="sm" onClick={() => navigate("/divipixel-pages")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux pages DiviPixel
        </Button>
      } 
      fullWidthMobile={true}
      containerClassName="max-w-5xl mx-auto"
    >
      <AnimatedContainer delay={200} className={isMobile ? "pb-6" : ""}>
        {!isMobile && (
          <div className="mb-4">
            {/* Espace vide pour la vue desktop si nécessaire */}
          </div>
        )}
        
        <div>
          {isMobile && (
            <div className="bg-muted/30 px-4 py-3 mb-4 text-sm text-muted-foreground flex items-center">
              <Wand2 className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Utilisez les boutons <b>Optimiser</b> pour améliorer votre contenu avec l'IA.</span>
            </div>
          )}
          
          <AnnouncementForm 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting || isPublishing} 
            isMobile={isMobile}
            isForDiviPixel={true} // Indiquer que c'est pour DiviPixel
          />
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default CreateDiviPixelPage;
