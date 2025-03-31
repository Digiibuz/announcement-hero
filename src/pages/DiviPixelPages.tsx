
import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import AnnouncementList from "@/components/announcements/AnnouncementList";
import AnnouncementFilter from "@/components/announcements/AnnouncementFilter";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { DiviPixelPage } from "@/types/announcement";
import { useDiviPixelCategories } from "@/hooks/wordpress/useDiviPixelCategories";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { deleteAnnouncement as apiDeleteAnnouncement } from "@/api/announcementApi";

const DiviPixelPages = () => {
  const { isAdmin, user } = useAuth();
  const [filter, setFilter] = useState({
    search: "",
    status: "all",
  });
  // Grid view est maintenant le seul mode d'affichage
  const viewMode = "grid";
  
  // Récupérer les catégories DiviPixel
  const { categories, refetch: refetchCategories } = useDiviPixelCategories();

  // Chargement initial des catégories
  useEffect(() => {
    if (user?.wordpressConfigId) {
      refetchCategories();
    }
  }, [user?.wordpressConfigId, refetchCategories]);

  // Récupérer les pages DiviPixel depuis Supabase
  const { data: diviPixelPages, isLoading, refetch } = useQuery({
    queryKey: ["divipixel-pages"],
    queryFn: async () => {
      let query = supabase
        .from("divipixel_pages")
        .select("*");
      
      // Si pas admin, afficher uniquement les pages de l'utilisateur
      if (!isAdmin) {
        query = query.filter("user_id", "eq", user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast.error("Erreur lors de la récupération des pages DiviPixel: " + error.message);
        return [];
      }
      
      // Mapper les IDs de catégorie WordPress aux noms
      return data.map(page => {
        // Créer un nouvel objet avec toutes les propriétés de la page
        const processed: any = { ...page };
        
        // Ajouter le nom de la catégorie WordPress si disponible
        if (page.wordpress_category_id && categories) {
          const category = categories.find(
            c => c.id.toString() === page.wordpress_category_id
          );
          
          if (category) {
            processed.wordpress_category_name = category.name;
          }
        }
        
        return processed;
      });
    },
    enabled: !!user,
  });

  // Filtrer les pages DiviPixel en fonction de la recherche et du statut
  const filteredDiviPixelPages = diviPixelPages?.filter(page => {
    // Filtrer par terme de recherche
    const matchesSearch = 
      filter.search === "" || 
      page.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (page.meta_description && page.meta_description.toLowerCase().includes(filter.search.toLowerCase())) ||
      (page.wordpress_category_name && page.wordpress_category_name.toLowerCase().includes(filter.search.toLowerCase()));
    
    // Filtrer par statut
    const matchesStatus = 
      filter.status === "all" || 
      page.status === filter.status;
    
    return matchesSearch && matchesStatus;
  });

  // Actualiser les données lorsque les catégories changent
  useEffect(() => {
    if (categories.length > 0) {
      refetch();
    }
  }, [categories, refetch]);

  // Gérer la suppression d'une page DiviPixel
  const handleDelete = async (id: string) => {
    try {
      if (!user?.id) {
        toast.error("Utilisateur non identifié");
        return;
      }

      // Récupérer les informations de la page DiviPixel
      const { data: page, error: fetchError } = await supabase
        .from("divipixel_pages")
        .select("wordpress_post_id")
        .eq("id", id)
        .single();

      if (fetchError) {
        toast.error("Erreur lors de la récupération des informations: " + fetchError.message);
        return;
      }

      // Si la page a un ID de post WordPress, utiliser l'API pour le supprimer
      if (page && page.wordpress_post_id) {
        try {
          // Simulation de la fonction apiDeleteAnnouncement pour les pages DiviPixel
          // Vous pourriez créer une fonction spécifique dans un fichier séparé plus tard
          await apiDeleteAnnouncement(id, user.id);
        } catch (error: any) {
          console.error("Erreur lors de la suppression WordPress:", error);
          toast.error("La page a été supprimée de l'application, mais pas de WordPress: " + error.message);
        }
      }

      // Supprimer la page DiviPixel de Supabase
      const { error } = await supabase
        .from("divipixel_pages")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
      
      toast.success("Page DiviPixel supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  const titleAction = (
    <Link to="/create-divipixel">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Créer une page DiviPixel
      </Button>
    </Link>
  );

  return (
    <PageLayout title="Pages DiviPixel" titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        <div className="mb-6">
          <AnnouncementFilter 
            filter={filter} 
            setFilter={setFilter} 
          />
        </div>

        <AnnouncementList 
          announcements={filteredDiviPixelPages || []} 
          isLoading={isLoading}
          onDelete={handleDelete}
          viewMode={viewMode}
        />
      </AnimatedContainer>

      <FloatingActionButton 
        position="bottom-right" 
        asChild
        showOnMobile={true}
        hideOnDesktop={true}
        className="bg-digibuz-yellow text-digibuz-navy hover:bg-digibuz-yellow/90 font-bold"
      >
        <Link to="/create-divipixel">
          <Plus className="mr-2 h-4 w-4" />
          Créer
        </Link>
      </FloatingActionButton>
    </PageLayout>
  );
};

export default DiviPixelPages;
