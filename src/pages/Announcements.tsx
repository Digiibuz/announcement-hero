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
import FloatingActionButton from "@/components/ui/FloatingActionButton";

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
  // Grid view is now the only view mode, so no need for state
  const viewMode = "grid";
  
  // Get WordPress categories
  const { categories, refetch: refetchCategories } = useWordPressCategories();

  // Initial load of categories
  useEffect(() => {
    if (user?.wordpressConfigId) {
      refetchCategories();
    }
  }, [user?.wordpressConfigId, refetchCategories]);

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
  });

  // Filter announcements based on search and status
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
    
    return matchesSearch && matchesStatus;
  });

  // Refetch data when categories change
  useEffect(() => {
    if (categories.length > 0) {
      refetch();
    }
  }, [categories, refetch]);

  // Handle announcement deletion
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .filter("id", "eq", id);
      
      if (error) throw error;
      
      toast.success("Annonce supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  const titleAction = (
    <Link to="/create">
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Créer une annonce
      </Button>
    </Link>
  );

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
