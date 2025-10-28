import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const useDeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si Capacitor est disponible
    if (!(window as any).Capacitor) {
      return;
    }

    console.log('🔗 Configuration du handler de deep links');

    // Gérer les deep links entrants
    const handleAppUrlOpen = (data: { url: string }) => {
      console.log('🔗 Deep link reçu:', data.url);

      try {
        const url = new URL(data.url);
        
        // Vérifier si c'est le callback Facebook (custom scheme ou HTTP)
        if (url.pathname === '/facebook-callback' || url.pathname === '//facebook-callback') {
          console.log('🔗 Callback Facebook détecté dans deep link');
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          
          if (code) {
            console.log('✅ Code Facebook trouvé dans deep link');
            localStorage.setItem('facebook_auth_code', code);
            localStorage.setItem('facebook_auth_timestamp', Date.now().toString());
            localStorage.setItem('facebook_auth_redirect', 'true');
            
            // Naviguer vers la page de profil ou de retour
            const returnUrl = localStorage.getItem('facebook_return_url') || '/profile';
            navigate(returnUrl);
          } else if (error) {
            console.error('❌ Erreur Facebook dans deep link:', error);
            localStorage.setItem('facebook_auth_error', error);
            navigate('/profile');
          }
        } else {
          // Naviguer vers le path du deep link
          navigate(url.pathname + url.search);
        }
      } catch (e) {
        console.error('❌ Erreur lors du traitement du deep link:', e);
      }
    };

    // S'abonner aux événements de deep link
    CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);
};
