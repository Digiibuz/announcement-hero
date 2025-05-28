
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

export const usePublicationLimits = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PublicationStats>({
    publishedCount: 0,
    maxLimit: 20,
    remaining: 20,
    percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Récupérer ou créer les limites mensuelles
      const { data: limitsData, error: limitsError } = await supabase
        .from('monthly_publication_limits')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();
      
      let currentLimits = limitsData;
      
      if (limitsError && limitsError.code === 'PGRST116') {
        // Créer un nouvel enregistrement si il n'existe pas
        const { data: newLimits, error: insertError } = await supabase
          .from('monthly_publication_limits')
          .insert({
            user_id: user.id,
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
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Note: Plus de fonction canPublish car maintenant ce sont des objectifs, pas des limites
  
  return {
    stats,
    isLoading,
    refreshStats: fetchStats
  };
};
