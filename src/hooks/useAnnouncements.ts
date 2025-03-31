
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement, AnnouncementStatus } from "@/types/announcement";
import { toast } from "sonner";

interface UseAnnouncementsParams {
  status?: AnnouncementStatus;
  search?: string;
  isPremium?: boolean;
  wordpressCategory?: string;
}

export const useAnnouncements = (params: UseAnnouncementsParams = {}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from("announcements")
        .select(`
          *,
          profiles:user_id (name, email)
        `)
        .order("created_at", { ascending: false });
      
      // Appliquer les filtres
      if (params.status) {
        query = query.eq("status", params.status);
      }
      
      // Utiliser une approche simplifiée pour les filtres de texte
      if (params.search && params.search.trim() !== '') {
        query = query.ilike("title", `%${params.search}%`);
      }
      
      if (params.isPremium === true) {
        query = query.eq("is_premium", true);
      }
      
      if (params.wordpressCategory && params.wordpressCategory.trim() !== '') {
        query = query.eq("wordpress_category", params.wordpressCategory);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      setAnnouncements(data || []);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des annonces:", error);
      toast.error(`Erreur: ${error.message}`);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [
    params.status, 
    params.search, 
    params.isPremium, 
    params.wordpressCategory
  ]);

  return {
    announcements,
    isLoading,
    refetch: fetchAnnouncements
  };
};
