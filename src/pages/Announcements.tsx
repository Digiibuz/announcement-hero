
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import AnnouncementList from "@/components/announcements/AnnouncementList";
import AnnouncementFilter from "@/components/announcements/AnnouncementFilter";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Announcement } from "@/types/announcement";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { deleteAnnouncement as apiDeleteAnnouncement } from "@/api/announcementApi";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-media-query";

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const Announcements = () => {
  const { isAdmin, user, isImpersonating } = useAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({
    search: "",
    status: "all",
    wordpressSite: "all",
  });
  const viewMode = "grid";
  
  // Get WordPress categories
  const { categories, refetch: refetchCategories } = useWordPressCategories();
  
  // Get WordPress configs for site info
  const { configs: wordpressConfigs } = useWordPressConfigs();

  useEffect(() => {
    if (user?.wordpressConfigId) {
      refetchCategories();
    }
  }, [user?.wordpressConfigId, refetchCategories]);

  // Invalidate cache when user changes (impersonation start/stop)
  useEffect(() => {
    console.log('🔄 User changed, invalidating announcements cache', {
      userId: user?.id,
      isAdmin,
      isImpersonating
    });
    queryClient.invalidateQueries({ queryKey: ["announcements"] });
  }, [user?.id, isImpersonating, queryClient]);

  // Fetch announcements
  const { data: announcements, isLoading, refetch } = useQuery({
    queryKey: ["announcements", user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select(`
          *,
          profiles!announcements_user_id_fkey (
            wordpress_config_id,
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      // Si on n'est pas admin OU si on est en mode impersonation, filtrer par user_id
      if (!isAdmin || isImpersonating) {
        console.log('🔍 Filtering announcements for user:', user?.id);
        query = query.filter("user_id", "eq", user?.id);
      } else {
        console.log('👑 Admin mode: showing all announcements');
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast({
          title: "Erreur",
          description: "Erreur lors du chargement des annonces: " + error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data.map(announcement => {
        const processed: Announcement & { 
          wordpress_site_name?: string;
          user_wordpress_config_id?: string;
          user_name?: string;
        } = { ...announcement } as any;
        
        if (processed.description) {
          processed.description = stripHtmlTags(processed.description);
        }
        
        // Ajouter les informations du site WordPress depuis le profil utilisateur
        if (announcement.profiles?.wordpress_config_id) {
          processed.user_wordpress_config_id = announcement.profiles.wordpress_config_id;
          const wordpressConfig = wordpressConfigs.find(
            config => config.id === announcement.profiles.wordpress_config_id
          );
          if (wordpressConfig) {
            processed.wordpress_site_name = wordpressConfig.name;
          }
        }
        
        // Ajouter le nom de l'utilisateur
        if (announcement.profiles?.name) {
          processed.user_name = announcement.profiles.name;
        }
        
        // Traitement des catégories WordPress existant
        if (announcement.wordpress_category_id && categories) {
          const category = categories.find(
            c => c.id.toString() === announcement.wordpress_category_id
          );
          
          if (category) {
            processed.wordpress_category_name = category.name;
          }
        }
        
        return processed;
      });
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });

  // Filter announcements
  const filteredAnnouncements = announcements?.filter(announcement => {
    const matchesSearch = 
      filter.search === "" || 
      announcement.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (announcement.description && announcement.description.toLowerCase().includes(filter.search.toLowerCase())) ||
      (announcement.wordpress_category_name && announcement.wordpress_category_name.toLowerCase().includes(filter.search.toLowerCase())) ||
      ((announcement as any).wordpress_site_name && (announcement as any).wordpress_site_name.toLowerCase().includes(filter.search.toLowerCase())) ||
      ((announcement as any).user_name && (announcement as any).user_name.toLowerCase().includes(filter.search.toLowerCase()));
    
    const matchesStatus = 
      filter.status === "all" || 
      announcement.status === filter.status;
    
    const matchesSite = 
      filter.wordpressSite === "all" || 
      (announcement as any).user_wordpress_config_id === filter.wordpressSite;
    
    return matchesSearch && matchesStatus && matchesSite;
  });

  useEffect(() => {
    if (categories.length > 0) {
      refetch();
    }
  }, [categories, refetch]);

  const handleDelete = async (id: string) => {
    try {
      if (!user?.id) {
        toast({
          title: "Erreur",
          description: "Utilisateur non identifié",
          variant: "destructive",
        });
        return;
      }

      await apiDeleteAnnouncement(id, user.id);
      
      toast({
        title: "Succès",
        description: "Annonce supprimée avec succès",
        variant: "default",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression: " + error.message,
        variant: "destructive",
      });
    }
  };

  const titleAction = !isMobile ? (
    <Link to="/create">
      <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold transform transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <Plus className="h-4 w-4 mr-2 relative z-10" />
        <span className="relative z-10">Créer une annonce</span>
      </Button>
    </Link>
  ) : null;

  return (
    <PageLayout title="Annonces" titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        <div className="mb-6">
          <AnnouncementFilter 
            filter={filter} 
            setFilter={setFilter} 
          />
        </div>

        <AnnouncementList 
          announcements={filteredAnnouncements || []} 
          isLoading={isLoading}
          onDelete={handleDelete}
          viewMode={viewMode}
        />
      </AnimatedContainer>
    </PageLayout>
  );
};

export default Announcements;
