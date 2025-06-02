
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { useAuth } from "@/context/AuthContext";

export const useRecentAnnouncements = (limit: number = 5) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isImpersonating, isAdmin } = useAuth();

  useEffect(() => {
    const fetchRecentAnnouncements = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        // Si on est admin ET pas en mode impersonation, montrer toutes les annonces
        if (isAdmin && !isImpersonating) {
          // Pas de filtre, toutes les annonces
        } 
        // Sinon (client, commercial ou mode impersonation), filtrer par user_id
        else {
          query = query.eq('user_id', user.id);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setAnnouncements(data || []);
      } catch (err: any) {
        console.error('Error fetching recent announcements:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAnnouncements();
  }, [user?.id, limit, isImpersonating, isAdmin]);

  return { announcements, isLoading, error };
};
