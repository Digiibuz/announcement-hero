import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FacebookLogin } from '@capacitor-community/facebook-login';

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

const isCapacitorApp = () => {
  return window.location.protocol === 'capacitor:' || 
         window.location.protocol === 'ionic:' ||
         (window as any).Capacitor !== undefined;
};

const getRedirectUri = () => {
  // Pour les apps Capacitor/Android, utiliser un custom URL scheme
  // qui sera intercepté directement par l'application
  if (isCapacitorApp()) {
    return 'digiibuz://facebook-callback';
  }
  // Pour le web, utiliser l'origine actuelle
  return `${window.location.origin}/facebook-callback`;
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

  const exchangeCodeForToken = useCallback(async (code: string, state?: string) => {
    try {
      console.log('🔑 Échange du code pour un token...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const redirectUri = getRedirectUri();
      const { data, error } = await supabase.functions.invoke('facebook-oauth', {
        body: { 
          code, 
          userId: user.id, 
          redirectUri,
          state: state || localStorage.getItem('facebook_auth_state') // Inclure le state
        },
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
        localStorage.removeItem('facebook_auth_state'); // Nettoyer le state
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

  // Vérifier s'il y a un code Facebook en attente (mobile redirect)
  useEffect(() => {
    const pendingCode = localStorage.getItem('facebook_auth_code');
    const pendingTimestamp = localStorage.getItem('facebook_auth_timestamp');
    
    if (pendingCode && pendingTimestamp) {
      const age = Date.now() - parseInt(pendingTimestamp);
      // Traiter le code s'il a moins de 30 secondes
      if (age < 30000) {
        console.log('🔄 Code Facebook en attente détecté, traitement...');
        setIsConnecting(true);
        exchangeCodeForToken(pendingCode);
      } else {
        // Code trop ancien, le nettoyer
        console.log('⏱️ Code Facebook expiré, nettoyage...');
        localStorage.removeItem('facebook_auth_code');
        localStorage.removeItem('facebook_auth_timestamp');
      }
    }
  }, [exchangeCodeForToken]);

  const connectFacebook = async () => {
    console.log('🔵 Démarrage connexion Facebook...');
    setIsConnecting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Sur mobile Capacitor : utiliser le SDK natif
      if (isCapacitorApp()) {
        console.log('📱 Utilisation du SDK Facebook natif');
        
        try {
          // Se connecter avec le SDK Facebook natif
          const result = await FacebookLogin.login({ 
            permissions: [
              'public_profile',
              'email',
              'pages_show_list',
              'pages_read_engagement', 
              'pages_manage_posts',
              'business_management',
              'instagram_basic',
              'instagram_content_publish',
              'pages_read_user_content'
            ]
          });

          if (result.accessToken) {
            console.log('✅ Token Facebook natif obtenu');
            
            // Échanger le token avec notre backend
            const { data, error } = await supabase.functions.invoke('facebook-oauth', {
              body: { 
                accessToken: result.accessToken.token,
                userId: user.id,
                isMobileSDK: true
              },
            });

            if (error) throw error;

            if (data?.success) {
              console.log('✅ Connexion Facebook réussie');
              toast.success('Page(s) Facebook connectée(s) avec succès !');
              await fetchConnections();
            } else {
              throw new Error(data?.error || 'Échec de la connexion Facebook');
            }
          } else {
            throw new Error('Aucun token reçu de Facebook');
          }
        } catch (error) {
          console.error('❌ Erreur SDK Facebook natif:', error);
          throw error;
        } finally {
          setIsConnecting(false);
        }
        return;
      }

      // Sur web : utiliser le flux OAuth classique
      const redirectUri = getRedirectUri();
      console.log('🖥️ Utilisation du flux OAuth web');
      console.log('🔵 Redirect URI:', redirectUri);
      
      // Get the auth URL from the edge function with userId for state generation
      const { data, error } = await supabase.functions.invoke('facebook-auth-url', {
        body: { redirectUri, userId: user.id },
      });

      console.log('🔵 Réponse edge function:', { data, error });

      if (error) throw error;
      
      if (!data?.authUrl) {
        throw new Error('No auth URL returned');
      }

      const isMobile = isMobileDevice();
      
      if (isMobile) {
        // Mobile web: redirection complète avec state
        console.log('📱 Appareil mobile web détecté - redirection complète');
        localStorage.setItem('facebook_auth_redirect', 'true');
        localStorage.setItem('facebook_auth_state', data.state);
        localStorage.setItem('facebook_return_url', window.location.pathname + window.location.search);
        
        if (window.location.pathname === '/create') {
          const currentStep = new URLSearchParams(window.location.search).get('step');
          if (currentStep) {
            localStorage.setItem('facebook_return_step', currentStep);
          }
        }
        
        window.location.href = data.authUrl;
        return;
      }

      // Desktop: popup
      console.log('🖥️ Desktop détecté - ouverture popup');
      
      localStorage.removeItem('facebook_auth_code');
      localStorage.removeItem('facebook_auth_error');
      localStorage.removeItem('instagram_2fa_detected');
      localStorage.setItem('facebook_auth_state', data.state);
      
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

      let attempts = 0;
      const maxAttempts = 240;
      
      const pollInterval = setInterval(() => {
        attempts++;
        
        if (popup.closed) {
          console.log('🔵 Popup fermée');
          clearInterval(pollInterval);
          window.removeEventListener('message', messageHandler);
          
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

        const code = localStorage.getItem('facebook_auth_code');
        const timestamp = localStorage.getItem('facebook_auth_timestamp');
        
        if (code && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          if (age < 10000) {
            console.log('✅ Code trouvé dans localStorage (2FA détecté)');
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            popup.close();
            exchangeCodeForToken(code);
          }
        }

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
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la connexion à Facebook');
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
