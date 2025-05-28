
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface PublicationStats {
  publishedCount: number;
  maxLimit: number;
  remaining: number;
  percentage: number;
}

export const usePublicationLimits = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [stats, setStats] = useState<PublicationStats>({
    publishedCount: 0,
    maxLimit: 20,
    remaining: 20,
    percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      setIsLoading(true);
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Récupérer ou créer les limites mensuelles
      const { data: limitsData, error: limitsError } = await supabase
        .from('monthly_publication_limits')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();
      
      let currentLimits = limitsData;
      
      if (!currentLimits) {
        // Créer un nouvel enregistrement si il n'existe pas
        const { data: newLimits, error: insertError } = await supabase
          .from('monthly_publication_limits')
          .insert({
            user_id: targetUserId,
            year: currentYear,
            month: currentMonth,
            published_count: 0,
            max_limit: 20
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        currentLimits = newLimits;
      } else if (limitsError) {
        throw limitsError;
      }
      
      if (currentLimits) {
        const publishedCount = currentLimits.published_count || 0;
        const maxLimit = currentLimits.max_limit || 20;
        const remaining = Math.max(0, maxLimit - publishedCount);
        const percentage = maxLimit > 0 ? (publishedCount / maxLimit) * 100 : 0;
        
        setStats({
          publishedCount,
          maxLimit,
          remaining,
          percentage
        });
      }
    } catch (error: any) {
      console.error('Error fetching publication stats:', error);
      toast.error("Erreur lors de la récupération des statistiques");
    } finally {
      setIsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fonctions utilitaires pour la compatibilité
  const getProgressPercentage = useCallback(() => {
    return stats.percentage;
  }, [stats.percentage]);

  const getStatusColor = useCallback(() => {
    if (stats.percentage >= 90) return "red";
    if (stats.percentage >= 70) return "orange";
    return "green";
  }, [stats.percentage]);

  const getBadgeText = useCallback(() => {
    if (stats.percentage >= 100) return "Objectif atteint";
    if (stats.percentage >= 90) return "Expert";
    if (stats.percentage >= 70) return "Actif";
    return "";
  }, [stats.percentage]);

  // Note: Plus de fonction canPublish car maintenant ce sont des objectifs, pas des limites
  const canPublish = useCallback(() => {
    return true; // Toujours autorisé maintenant que ce sont des objectifs
  }, []);

  const incrementPublicationCount = useCallback(async (): Promise<boolean> => {
    if (!targetUserId) return false;

    try {
      const { error } = await supabase
        .rpc('increment_monthly_publication_count', { p_user_id: targetUserId });
      
      if (error) throw error;
      
      // Refresh stats after increment
      await fetchStats();
      return true;
    } catch (error: any) {
      console.error('Error incrementing publication count:', error);
      toast.error("Erreur lors de l'incrémentation du compteur");
      return false;
    }
  }, [targetUserId, fetchStats]);

  const updateMaxLimit = useCallback(async (newLimit: number): Promise<boolean> => {
    if (!targetUserId) return false;

    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { error } = await supabase
        .from('monthly_publication_limits')
        .upsert({
          user_id: targetUserId,
          year: currentYear,
          month: currentMonth,
          max_limit: newLimit
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) throw error;

      await fetchStats();
      return true;
    } catch (error: any) {
      console.error('Error updating publication limit:', error);
      toast.error("Erreur lors de la mise à jour de la limite");
      return false;
    }
  }, [targetUserId, fetchStats]);
  
  return {
    stats,
    isLoading,
    refreshStats: fetchStats,
    // Fonctions de compatibilité
    canPublish,
    getProgressPercentage,
    getStatusColor,
    getBadgeText,
    incrementPublicationCount,
    updateMaxLimit,
    refetch: fetchStats
  };
};
