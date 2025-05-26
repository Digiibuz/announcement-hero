
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface DashboardStats {
  totalUsers: number;
  totalWordPressConfigs: number;
  totalAnnouncements: number;
  publishedAnnouncements: number;
  scheduledAnnouncements: number;
  draftAnnouncements: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalWordPressConfigs: 0,
    totalAnnouncements: 0,
    publishedAnnouncements: 0,
    scheduledAnnouncements: 0,
    draftAnnouncements: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      if (isAdmin) {
        // Pour les admins, récupérer toutes les statistiques
        const [usersResponse, wordpressResponse, announcementsResponse] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('wordpress_configs').select('id', { count: 'exact', head: true }),
          supabase.from('announcements').select('id, status', { count: 'exact' })
        ]);

        if (usersResponse.error) throw usersResponse.error;
        if (wordpressResponse.error) throw wordpressResponse.error;
        if (announcementsResponse.error) throw announcementsResponse.error;

        // Compter les annonces par statut
        const announcements = announcementsResponse.data || [];
        const published = announcements.filter(a => a.status === 'published').length;
        const scheduled = announcements.filter(a => a.status === 'scheduled').length;
        const draft = announcements.filter(a => a.status === 'draft').length;

        setStats({
          totalUsers: usersResponse.count || 0,
          totalWordPressConfigs: wordpressResponse.count || 0,
          totalAnnouncements: announcementsResponse.count || 0,
          publishedAnnouncements: published,
          scheduledAnnouncements: scheduled,
          draftAnnouncements: draft,
        });
      } else {
        // Pour les clients, récupérer seulement leurs propres annonces
        const { data: announcements, error, count } = await supabase
          .from('announcements')
          .select('id, status', { count: 'exact' })
          .eq('user_id', user?.id);

        if (error) throw error;

        const published = announcements?.filter(a => a.status === 'published').length || 0;
        const scheduled = announcements?.filter(a => a.status === 'scheduled').length || 0;
        const draft = announcements?.filter(a => a.status === 'draft').length || 0;

        setStats({
          totalUsers: 0,
          totalWordPressConfigs: 0,
          totalAnnouncements: count || 0,
          publishedAnnouncements: published,
          scheduledAnnouncements: scheduled,
          draftAnnouncements: draft,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error("Erreur lors de la récupération des statistiques");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, isAdmin]);

  return {
    stats,
    isLoading,
    refetch: fetchStats
  };
};
