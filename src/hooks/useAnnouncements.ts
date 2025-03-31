
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement, FilterState } from "@/types/announcement";

type AnnouncementResult = {
  announcements: Announcement[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export const useAnnouncements = (filter: FilterState): AnnouncementResult => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrer par catégorie
      if (filter.category) {
        query = query.eq('wordpress_category_id', filter.category);
      }

      // Filtrer par statut
      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      // Filtrer par texte de recherche
      if (filter.searchText) {
        query = query.or(`title.ilike.%${filter.searchText}%,description.ilike.%${filter.searchText}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Error fetching announcements: ${fetchError.message}`);
      }

      setAnnouncements(data || []);
    } catch (err) {
      console.error("Error in useAnnouncements:", err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filter.category, filter.status, filter.searchText]);

  return {
    announcements,
    isLoading,
    error,
    refetch: fetchAnnouncements,
  };
};
