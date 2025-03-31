
import React, { useEffect, useState } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import AnnouncementList from "@/components/announcements/AnnouncementList";
import AnnouncementFilter from "@/components/announcements/AnnouncementFilter";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { AnnouncementStatus } from "@/types/announcement";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";

export default function Announcements() {
  const { isAdmin, isClient } = useAuth();
  const canCreateAnnouncement = isAdmin || isClient;
  
  const [filters, setFilters] = useState({
    status: "" as AnnouncementStatus | "",
    search: "",
    isPremium: false,
    wordpressCategory: ""
  });

  const { announcements, isLoading, refetch } = useAnnouncements({
    ...filters,
    status: filters.status as AnnouncementStatus | undefined
  });

  // Fetch WordPress data
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    fetchCategories,
  } = useWordPressCategories();
  
  const { 
    pages, 
    isLoading: isPagesLoading, 
    refetch: refetchPages 
  } = useWordPressPages();

  useEffect(() => {
    // Initial load
    refetch();
    
    // Only attempt to fetch WordPress data if user is admin or client
    if (canCreateAnnouncement) {
      fetchCategories();
      refetchPages();
    }
  }, []);

  // No need to show filters to non-admin users
  const showFilters = isAdmin;

  return (
    <PageLayout 
      title="Annonces" 
      titleAction={
        canCreateAnnouncement && (
          <Link to="/annonces/ajouter">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nouvelle annonce
            </Button>
          </Link>
        )
      }
      onRefresh={refetch}
    >
      <AnimatedContainer delay={200}>
        <div className="space-y-4">
          {showFilters && (
            <AnnouncementFilter
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              isCategoriesLoading={isCategoriesLoading}
            />
          )}
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">
              Liste des annonces 
              {announcements?.length > 0 && (
                <Badge variant="outline" className="ml-2 font-normal">
                  {announcements.length}
                </Badge>
              )}
            </h2>
          </div>
          
          <AnnouncementList 
            announcements={announcements || []} 
            isLoading={isLoading} 
          />
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
}
