
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useServiceWorker } from './useServiceWorker';

export const useVersionTracking = () => {
  const { user } = useAuth();
  const { getVersion } = useServiceWorker();

  useEffect(() => {
    const updateUserVersion = async () => {
      if (!user) return;

      try {
        const currentVersion = getVersion();
        
        // Mettre à jour la version de l'utilisateur dans la base de données
        const { error } = await supabase
          .from('profiles')
          .update({ app_version: currentVersion } as any)
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user version:', error);
        }
      } catch (error) {
        console.error('Error in version tracking:', error);
      }
    };

    updateUserVersion();
  }, [user, getVersion]);
};
