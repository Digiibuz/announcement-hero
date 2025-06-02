
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

export const useCommercials = () => {
  const [commercials, setCommercials] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCommercials = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'commercial')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      const formattedCommercials: UserProfile[] = data.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as any,
        clientId: profile.client_id,
        wordpressConfigId: profile.wordpress_config_id
      }));
      
      setCommercials(formattedCommercials);
    } catch (error: any) {
      console.error('Error fetching commercials:', error);
      toast.error("Erreur lors de la récupération des commerciaux");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommercials();
  }, []);

  return { 
    commercials, 
    isLoading, 
    fetchCommercials 
  };
};
