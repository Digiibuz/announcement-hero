
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type FilterState = {
  status: "draft" | "published" | "scheduled" | null;
  searchTerm: string;
};

export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    status: null,
    searchTerm: "",
  });

  const fetchAnnouncements = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching announcements with filters:", filters);
      
      let query = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter if it exists
      if (filters.status) {
        // Fix type issue by ensuring status is a valid value
        const validStatus = filters.status as "draft" | "published" | "scheduled";
        query = query.eq("status", validStatus);
      }

      // Apply search filter if it exists
      if (filters.searchTerm) {
        query = query.ilike("title", `%${filters.searchTerm}%`);
      }

      // If not an admin, only show the user's own announcements
      if (!user.isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching announcements:", fetchError);
        setError(fetchError.message);
        toast.error("Erreur lors du chargement des annonces");
        return;
      }

      console.log("Fetched announcements:", data?.length || 0);
      setAnnouncements(data as Announcement[]);
    } catch (err: any) {
      console.error("Error in useAnnouncements:", err);
      setError(err.message);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user, fetchAnnouncements]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    announcements,
    isLoading,
    error,
    filters,
    updateFilters,
    refreshAnnouncements: fetchAnnouncements,
  };
};
