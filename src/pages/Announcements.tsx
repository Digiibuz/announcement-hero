
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
import { Announcement } from "@/types/announcement";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { deleteAnnouncement as apiDeleteAnnouncement } from "@/api/announcementApi";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { useIsMobile } from "@/hooks/use-media-query";

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const Announcements = () => {
  const { isAdmin, user } = useAuth();
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState({
    search: "",
    status: "all",
  });
  const viewMode = "grid";
  
  // Get WordPress categories - réactivation du refetch
  const { categories, refetch: refetchCategories } = useWordPressCategories();

  useEffect(() => {
    if (user?.wordpressConfigId) {
      refetchCategories();
    }
  }, [user?.wordpressConfigId, refetchCategories]);

  // Fetch announcements - réactivation partielle des refetch pour éviter les pages blanches
  const { data: announcements, isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*")
        .order('created_at', { ascending: false }); // Tri des plus récentes aux plus anciennes
      
      if (!isAdmin) {
        query = query.filter("user_id", "eq", user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast.error("Error fetching announcements: " + error.message);
        return [];
      }
      
      return data.map(announcement => {
        const processed: Announcement = { ...announcement } as Announcement;
        
        if (processed.description) {
          processed.description = stripHtmlTags(processed.description);
        }
        
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
    refetchOnWindowFocus: true, // Réactivé pour éviter les pages blanches
    refetchOnMount: true,       // Réactivé pour assurer le chargement
    refetchOnReconnect: false,  // Gardé désactivé pour éviter les refetch excessifs
    staleTime: 30000,          // Cache pendant 30 secondes
    gcTime: 5 * 60 * 1000,     // Garde en cache pendant 5 minutes
  });

  // Filter announcements
  const filteredAnnouncements = announcements?.filter(announcement => {
    const matchesSearch = 
      filter.search === "" || 
      announcement.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (announcement.description && announcement.description.toLowerCase().includes(filter.search.toLowerCase())) ||
      (announcement.wordpress_category_name && announcement.wordpress_category_name.toLowerCase().includes(filter.search.toLowerCase()));
    
    const matchesStatus = 
      filter.status === "all" || 
      announcement.status === filter.status;
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (categories.length > 0) {
      refetch();
    }
  }, [categories, refetch]);

  const handleDelete = async (id: string) => {
    try {
      if (!user?.id) {
        toast.error("Utilisateur non identifié");
        return;
      }

      await apiDeleteAnnouncement(id, user.id);
      
      toast.success("Annonce supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression: " + error.message);
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

      {/* Floating Action Button for mobile with same style as Dashboard */}
      <FloatingActionButton 
        position="bottom-right" 
        asChild
        showOnMobile={true}
        hideOnDesktop={true}
        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold transform transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 group relative overflow-hidden"
      >
        <Link to="/create">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          <span className="text-2xl">✨</span>
        </Link>
      </FloatingActionButton>
    </PageLayout>
  );
};

export default Announcements;
