
"use client"

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import PageLayout from "@/components/ui/layout/PageLayout";
import { toast } from "sonner";
import { ArrowLeft, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDivipixelPublications } from "@/hooks/useDivipixelPublications";
import AnnouncementForm from "@/components/announcements/AnnouncementForm"; 

const CreateDivipixelPublication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const { createPublication, isSubmitting } = useDivipixelPublications();

  const handleSubmit = async (data: any) => {
    try {
      await createPublication(data);
      navigate("/divipixel-publications");
    } catch (error) {
      console.error("Erreur lors de la création de la publication:", error);
    }
  };

  return (
    <PageLayout 
      title="Créer une publication Divipixel" 
      titleAction={
        <Button variant="outline" size="sm" onClick={() => navigate("/divipixel-publications")} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux publications
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
            isSubmitting={isSubmitting} 
            isMobile={isMobile}
            formType="divipixel" // Nouveau paramètre pour indiquer le type de formulaire
          />
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default CreateDivipixelPublication;
