
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface PublicationStats {
  publishedCount: number;
  maxLimit: number;
  remaining: number;
}

export const usePublicationLimits = () => {
  const [stats, setStats] = useState<PublicationStats>({
    publishedCount: 0,
    maxLimit: 20,
    remaining: 20,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchPublicationStats = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_monthly_publication_count', { p_user_id: user.id });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          publishedCount: result.published_count,
          maxLimit: result.max_limit,
          remaining: result.remaining,
        });
      }
    } catch (error) {
      console.error('Error fetching publication stats:', error);
      toast.error("Erreur lors de la récupération des statistiques");
    } finally {
      setIsLoading(false);
    }
  };

  const incrementPublicationCount = async () => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .rpc('increment_monthly_publication_count', { p_user_id: user.id });

      if (error) throw error;

      // Refresh stats after increment
      await fetchPublicationStats();
      return true;
    } catch (error) {
      console.error('Error incrementing publication count:', error);
      toast.error("Erreur lors de la mise à jour du compteur");
      return false;
    }
  };

  const canPublish = () => {
    return stats.remaining > 0;
  };

  const getProgressPercentage = () => {
    return (stats.publishedCount / stats.maxLimit) * 100;
  };

  const getStatusColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 50) return "green";
    if (percentage < 80) return "orange";
    return "red";
  };

  const getBadgeText = () => {
    const count = stats.publishedCount;
    if (count >= 15) return "Expert";
    if (count >= 10) return "Productif";
    if (count >= 5) return "Actif";
    return null;
  };

  useEffect(() => {
    fetchPublicationStats();
  }, [user]);

  return {
    stats,
    isLoading,
    canPublish,
    incrementPublicationCount,
    getProgressPercentage,
    getStatusColor,
    getBadgeText,
    refetch: fetchPublicationStats
  };
};
