
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { useAuth } from "@/context/AuthContext";

export const useRecentAnnouncements = (limit: number = 5) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isImpersonating } = useAuth();

  useEffect(() => {
    const fetchRecentAnnouncements = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('announcements')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (fetchError) {
          throw fetchError;
        }

        setAnnouncements(data as Announcement[] || []);
      } catch (err: any) {
        console.error('Error fetching recent announcements:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, [user?.id, limit, isImpersonating]); // Ajout de isImpersonating pour recharger lors des changements

  return { announcements, isLoading, error };
};
