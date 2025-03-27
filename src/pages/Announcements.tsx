
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import AnnouncementList from "@/components/announcements/AnnouncementList";
import AnnouncementFilter from "@/components/announcements/AnnouncementFilter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Announcement } from "@/types/announcement";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";

const Announcements = () => {
  const { isAdmin, user } = useAuth();
  const [filter, setFilter] = useState({
    search: "",
    status: "all",
  });
  // Grid view is now the only view mode, so no need for state
  const viewMode = "grid";
  
  // Get WordPress categories
  const { categories } = useWordPressCategories();

  // Fetch announcements from Supabase
  const { data: announcements, isLoading, refetch } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*");
      
      // If not admin, only show own announcements
      if (!isAdmin) {
        query = query.eq("user_id", user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        toast.error("Error fetching announcements: " + error.message);
        return [];
      }
      
      // Map WordPress category IDs to names
      return data.map(announcement => {
        if (announcement.wordpress_category_id && categories) {
          const category = categories.find(
            c => c.id.toString() === announcement.wordpress_category_id
          );
          
          if (category) {
            return {
              ...announcement,
              wordpress_category_name: category.name
            };
          }
        }
        
        return announcement;
      }) as Announcement[];
    },
    enabled: true,
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

  // Handle announcement deletion
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast.success("Annonce supprimée avec succès");
      refetch();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-3xl font-bold">Annonces</h1>
              <Link to="/create">
                <Button className="mt-4 sm:mt-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une annonce
                </Button>
              </Link>
            </div>

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
        </div>
      </main>
    </div>
  );
};

export default Announcements;
