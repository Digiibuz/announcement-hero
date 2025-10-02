import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface FacebookConnection {
  id: string;
  user_id: string;
  page_id: string;
  page_name: string;
  page_access_token: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useFacebookConnection = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<FacebookConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnections = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('facebook_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching Facebook connections:', error);
      toast.error('Erreur lors du chargement des connexions Facebook');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, [user?.id]);

  const connectFacebook = async () => {
    setIsConnecting(true);
    try {
      // Note: Facebook App ID doit être configuré via les secrets Supabase
      // Pour l'instant, nous utilisons une valeur temporaire
      const redirectUri = `${window.location.origin}/facebook-callback`;
      const scope = 'pages_show_list,pages_read_engagement,pages_manage_posts';
      
      // Le client ID sera passé depuis l'edge function qui a accès aux secrets
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_FACEBOOK_APP_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
      
      toast.info('Configuration Facebook requise. Contactez l\'administrateur pour configurer FACEBOOK_APP_ID.');
      setIsConnecting(false);
      
      // window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting Facebook:', error);
      toast.error('Erreur lors de la connexion à Facebook');
      setIsConnecting(false);
    }
  };

  const disconnectFacebook = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('facebook_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      
      toast.success('Page Facebook déconnectée');
      fetchConnections();
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const hasActiveConnection = connections.length > 0;

  return {
    connections,
    isLoading,
    isConnecting,
    hasActiveConnection,
    connectFacebook,
    disconnectFacebook,
    refreshConnections: fetchConnections,
  };
};
