
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement, AnnouncementStatus } from "@/types/announcement";
import { toast } from "sonner";

interface UseAnnouncementsParams {
  status?: AnnouncementStatus | null;
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
      
      // Apply filters
      if (params.status) {
        query = query.eq("status", params.status);
      }
      
      // Use a simplified approach for text filters
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
  // Using explicit dependency list to avoid TypeScript issue
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
