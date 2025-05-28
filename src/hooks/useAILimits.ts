
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AILimitsStats {
  generationCount: number;
  maxLimit: number;
  remaining: number;
}

export const useAILimits = (userId?: string) => {
  const [stats, setStats] = useState<AILimitsStats>({
    generationCount: 0,
    maxLimit: 50,
    remaining: 50
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAILimits = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .rpc('get_monthly_ai_count', { p_user_id: userId });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          generationCount: result.generation_count || 0,
          maxLimit: result.max_limit || 50,
          remaining: result.remaining || 50
        });
      }
    } catch (error: any) {
      console.error('Error fetching AI limits:', error);
      toast.error("Erreur lors de la récupération des limites IA");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAILimits();
  }, [fetchAILimits]);

  const canGenerate = useCallback((): boolean => {
    return stats.remaining > 0;
  }, [stats.remaining]);

  const incrementGeneration = useCallback(async (): Promise<boolean> => {
    if (!userId || !canGenerate()) {
      return false;
    }

    try {
      const { error } = await supabase
        .rpc('increment_monthly_ai_count', { p_user_id: userId });
      
      if (error) throw error;
      
      // Refresh stats after increment
      await fetchAILimits();
      return true;
    } catch (error: any) {
      console.error('Error incrementing AI count:', error);
      toast.error("Erreur lors de l'incrémentation du compteur IA");
      return false;
    }
  }, [userId, canGenerate, fetchAILimits]);

  const updateAILimit = useCallback(async (newLimit: number): Promise<boolean> => {
    if (!userId) return false;

    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { error } = await supabase
        .from('monthly_ai_limits')
        .upsert({
          user_id: userId,
          year: currentYear,
          month: currentMonth,
          max_limit: newLimit
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) throw error;

      await fetchAILimits();
      return true;
    } catch (error: any) {
      console.error('Error updating AI limit:', error);
      toast.error("Erreur lors de la mise à jour de la limite IA");
      return false;
    }
  }, [userId, fetchAILimits]);

  return {
    stats,
    isLoading,
    canGenerate,
    incrementGeneration,
    updateAILimit,
    refreshStats: fetchAILimits
  };
};
