import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const useFacebookConnection = () => {
  const [connections, setConnections] = useState<FacebookConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnections = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('facebook_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Erreur lors du chargement des connexions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const exchangeCodeForToken = useCallback(async (code: string) => {
    try {
      console.log('🔑 Échange du code pour un token...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const redirectUri = `${window.location.origin}/facebook-callback`;
      const { data, error } = await supabase.functions.invoke('facebook-oauth', {
        body: { code, userId: user.id, redirectUri },
      });

      if (error) throw error;

      if (data?.success) {
        console.log('✅ Connexion Facebook réussie');
        toast.success('Page(s) Facebook connectée(s) avec succès !');
        await fetchConnections();
        
        // Nettoyer localStorage
        localStorage.removeItem('facebook_auth_code');
        localStorage.removeItem('facebook_auth_timestamp');
        localStorage.removeItem('instagram_2fa_detected');
      } else {
        throw new Error(data?.error || 'Échec de la connexion Facebook');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'échange du code:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion à Facebook');
    } finally {
      setIsConnecting(false);
    }
  }, [fetchConnections]);

  const connectFacebook = async () => {
    console.log('🔵 Démarrage connexion Facebook...');
    setIsConnecting(true);
    
    try {
      const redirectUri = `${window.location.origin}/facebook-callback`;
      console.log('🔵 Redirect URI:', redirectUri);
      
      // Get the auth URL from the edge function
      const { data, error } = await supabase.functions.invoke('facebook-auth-url', {
        body: { redirectUri },
      });

      console.log('🔵 Réponse edge function:', { data, error });

      if (error) throw error;
      
      if (!data?.authUrl) {
        throw new Error('No auth URL returned');
      }

      const isMobile = isMobileDevice();
      
      if (isMobile) {
        // Mobile: redirection complète
        console.log('📱 Appareil mobile détecté - redirection complète');
        localStorage.setItem('facebook_auth_redirect', 'true');
        window.location.href = data.authUrl;
        return;
      }

      // Desktop: popup
      console.log('🖥️ Desktop détecté - ouverture popup');
      
      // Nettoyer les anciennes données
      localStorage.removeItem('facebook_auth_code');
      localStorage.removeItem('facebook_auth_error');
      localStorage.removeItem('instagram_2fa_detected');
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        data.authUrl,
        'Facebook Login',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      
      if (!popup) {
        throw new Error('Popup bloquée par le navigateur. Veuillez autoriser les popups pour ce site.');
      }

      // Méthode 1: PostMessage (cas normal)
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS') {
          console.log('✅ Code reçu via postMessage');
          window.removeEventListener('message', messageHandler);
          clearInterval(pollInterval);
          exchangeCodeForToken(event.data.code);
        }
      };
      
      window.addEventListener('message', messageHandler);

      // Méthode 2: Polling localStorage (2FA ou fallback)
      let attempts = 0;
      const maxAttempts = 60; // 30 secondes max
      
      const pollInterval = setInterval(() => {
        attempts++;
        
        // Vérifier si popup fermée
        if (popup.closed) {
          console.log('🔵 Popup fermée');
          clearInterval(pollInterval);
          window.removeEventListener('message', messageHandler);
          
          // Vérifier une dernière fois le localStorage
          const code = localStorage.getItem('facebook_auth_code');
          const error = localStorage.getItem('facebook_auth_error');
          
          if (code) {
            console.log('✅ Code trouvé dans localStorage après fermeture');
            exchangeCodeForToken(code);
          } else if (error) {
            console.error('❌ Erreur trouvée:', error);
            toast.error('Erreur lors de la connexion à Facebook');
            setIsConnecting(false);
          } else {
            console.log('ℹ️ Popup fermée sans code - annulée par l\'utilisateur');
            setIsConnecting(false);
          }
          return;
        }

        // Polling localStorage (cas 2FA)
        const code = localStorage.getItem('facebook_auth_code');
        const timestamp = localStorage.getItem('facebook_auth_timestamp');
        
        if (code && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < 10000) { // Code de moins de 10 secondes
            console.log('✅ Code trouvé dans localStorage (2FA détecté)');
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            popup.close();
            exchangeCodeForToken(code);
          }
        }

        // Timeout
        if (attempts >= maxAttempts) {
          console.log('⏱️ Timeout atteint');
          clearInterval(pollInterval);
          window.removeEventListener('message', messageHandler);
          popup.close();
          toast.error('Délai d\'attente dépassé');
          setIsConnecting(false);
        }
      }, 500);

    } catch (error) {
      console.error('❌ Error connecting Facebook:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion à Facebook. Vérifiez que FACEBOOK_APP_ID est configuré.');
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
      await fetchConnections();
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
