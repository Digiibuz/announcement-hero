
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MaintenanceSettings {
  id?: string;
  message: string | null;
  isMaintenanceMode: boolean;
  maintenanceStart: string | null;
  maintenanceEnd: string | null;
}

export const useMaintenanceSettings = () => {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    message: null,
    isMaintenanceMode: false,
    maintenanceStart: null,
    maintenanceEnd: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          id: data.id,
          message: data.message,
          isMaintenanceMode: data.is_maintenance_mode,
          maintenanceStart: data.maintenance_start,
          maintenanceEnd: data.maintenance_end,
        });
      }
    } catch (error) {
      console.error('Error fetching maintenance settings:', error);
    }
  };

  const checkMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_maintenance_active');
      if (error) throw error;
      setIsMaintenanceActive(data);
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    }
  };

  const getMaintenanceMessage = async () => {
    try {
      const { data, error } = await supabase.rpc('get_maintenance_message');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting maintenance message:', error);
      return null;
    }
  };

  const saveSettings = async (newSettings: Omit<MaintenanceSettings, 'id'>) => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const settingsData = {
        message: newSettings.message,
        is_maintenance_mode: newSettings.isMaintenanceMode,
        maintenance_start: newSettings.maintenanceStart,
        maintenance_end: newSettings.maintenanceEnd,
        created_by: userData.user.id,
      };

      if (settings.id) {
        const { error } = await supabase
          .from('maintenance_settings')
          .update(settingsData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('maintenance_settings')
          .insert(settingsData);
        if (error) throw error;
      }

      await fetchSettings();
      await checkMaintenanceStatus();
      toast.success('Paramètres de maintenance sauvegardés');
    } catch (error: any) {
      console.error('Error saving maintenance settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    checkMaintenanceStatus();
  }, []);

  return {
    settings,
    isLoading,
    isMaintenanceActive,
    saveSettings,
    getMaintenanceMessage,
    checkMaintenanceStatus,
  };
};
