
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
import { useWordPressCategories } from "@/hooks/useWordPressCategories";
import { useWordPressDivipixelCategories } from "@/hooks/useWordPressDivipixelCategories";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { deleteAnnouncement as apiDeleteAnnouncement } from "@/api/announcementApi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

const Announcements = () => {
  const { isAdmin, user } = useAuth();
  const [filter, setFilter] = useState({
    search: "",
    status: "all",
  });
  const [activeTab, setActiveTab] = useState("all");
  // Grid view is now the only view mode, so no need for state
  const viewMode = "grid";
  
  // Get WordPress categories
  const { categories: wpCategories, refetch: refetchWpCategories } = useWordPressCategories();
  const { categories: divipixelCategories, refetch: refetchDivipixelCategories } = useWordPressDivipixelCategories();

  // Initial load of categories
  useEffect(() => {
    if (user?.wordpressConfigId) {
      refetchWpCategories();
      refetchDivipixelCategories();
    }
  }, [user?.wordpressConfigId, refetchWpCategories, refetchDivipixelCategories]);

  // Fetch announcements from Supabase
  const { data: announcements, isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*");
      
      // If not admin, only show own announcements
      if (!isAdmin) {
        query = query.filter("user_id", "eq", user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast.error("Error fetching announcements: " + error.message);
        return [];
      }
      
      // Map WordPress category IDs to names and strip HTML from descriptions for list view only
      return data.map(announcement => {
        // Create a new object with all properties from announcement
        const processed: Announcement = { ...announcement } as Announcement;
        
        // Strip HTML tags from description for the list view only
        if (processed.description) {
          processed.description = stripHtmlTags(processed.description);
        }
        
        // Add WordPress category name if available
        if (announcement.wordpress_category_id) {
          if (announcement.is_divipixel) {
            // For Divipixel publications
            const category = divipixelCategories.find(
              c => c.id.toString() === announcement.wordpress_category_id
            );
            
            if (category) {
              processed.wordpress_category_name = category.name;
            }
          } else {
            // For regular announcements
            const category = wpCategories.find(
              c => c.id.toString() === announcement.wordpress_category_id
            );
            
            if (category) {
              processed.wordpress_category_name = category.name;
            }
          }
        }
        
        return processed;
      });
    },
    enabled: !!user,
  });

  // Filter announcements based on search, status, and type (divipixel or regular)
  const filteredAnnouncements = announcements?.filter(announcement => {
    // Filter by search term
    const matchesSearch = 
      filter.search === "" || 
      announcement.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (announcement.description && announcement.description.toLowerCase().includes(filter.search.toLowerCase())) ||
      (announcement.wordpress_category_name && announcement.wordpress_category_name.toLowerCase().includes(filter.search.toLowerCase()));
    
    // Filter by status
    const matchesStatus = 
      filter.status === "all" || 
      announcement.status === filter.status;
    
    // Filter by type (divipixel or regular)
    const matchesType = 
      activeTab === "all" || 
      (activeTab === "divipixel" && announcement.is_divipixel) ||
      (activeTab === "regular" && !announcement.is_divipixel);
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Refetch data when categories change
  useEffect(() => {
    if ((wpCategories.length > 0 || divipixelCategories.length > 0) && announcements?.length > 0) {
      refetch();
    }
  }, [wpCategories, divipixelCategories, announcements?.length, refetch]);

  // Handle announcement deletion
  const handleDelete = async (id: string) => {
    try {
      if (!user?.id) {
        toast.error("Utilisateur non identifié");
        return;
      }

      // Utiliser l'API pour supprimer l'annonce (et son équivalent WordPress si existant)
      await apiDeleteAnnouncement(id, user.id);
      
      toast.success("Annonce supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  const titleAction = (
    <div className="flex gap-2">
      <Link to="/create">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Créer une annonce
        </Button>
      </Link>
      <Link to="/create-divipixel">
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Créer une publication
        </Button>
      </Link>
    </div>
  );

  return (
    <PageLayout title="Annonces" titleAction={titleAction}>
      <AnimatedContainer delay={200}>
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="regular">Annonces</TabsTrigger>
              <TabsTrigger value="divipixel">Publications Divipixel</TabsTrigger>
            </TabsList>
          </Tabs>
          
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

      <FloatingActionButton 
        position="bottom-right" 
        asChild
        showOnMobile={true}
        hideOnDesktop={true}
        className="bg-digibuz-yellow text-digibuz-navy hover:bg-digibuz-yellow/90 font-bold"
      >
        <Link to="/create">
          <Plus className="mr-2 h-4 w-4" />
          Créer
        </Link>
      </FloatingActionButton>
    </PageLayout>
  );
};

export default Announcements;
