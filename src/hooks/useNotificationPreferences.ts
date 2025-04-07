
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { NotificationPreferences } from '@/types/notifications';

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reminder_enabled: true,
    alert_enabled: true,
    info_enabled: true,
  });

  // Charger les préférences de notifications de l'utilisateur
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      // S'assurer que tous les en-têtes nécessaires sont inclus
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 est l'erreur "did not return a single row" - ignorable
        console.error('Erreur complète lors du chargement des préférences:', error);
        throw error;
      }

      if (data) {
        // Cast explicite vers le type de préférences
        const prefs = data as unknown as {
          reminder_enabled: boolean;
          alert_enabled: boolean;
          info_enabled: boolean;
        };
        
        setPreferences({
          reminder_enabled: prefs.reminder_enabled,
          alert_enabled: prefs.alert_enabled,
          info_enabled: prefs.info_enabled,
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des préférences:', error.message);
    }
  };

  // Mettre à jour les préférences de notifications
  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences as any)
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Préférences de notifications mises à jour');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des préférences:', error.message);
      toast.error('Impossible de mettre à jour les préférences');
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  return {
    preferences,
    fetchPreferences,
    updatePreferences
  };
};
