
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AppLifecycleOptions {
  onResume?: () => void;
  onHide?: () => void;
  savePageState?: boolean;
}

/**
 * Hook pour gérer le cycle de vie de l'application et prévenir les rechargements indésirables
 */
export function useAppLifecycle(options: AppLifecycleOptions = {}) {
  const { onResume, onHide, savePageState = true } = options;
  const location = useLocation();

  // Sauvegarder l'état de la page actuelle lorsque l'utilisateur quitte ou change d'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // L'utilisateur a quitté la page
        if (savePageState) {
          try {
            sessionStorage.setItem('app_last_path', location.pathname + location.search + location.hash);
            sessionStorage.setItem('app_last_scroll', JSON.stringify({
              x: window.scrollX,
              y: window.scrollY
            }));
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde de l\'état de la page:', error);
          }
        }
        
        // Callback personnalisé
        if (onHide) {
          onHide();
        }
      } else if (document.visibilityState === 'visible') {
        // L'utilisateur est revenu sur la page
        
        // Callback personnalisé
        if (onResume) {
          onResume();
        }
      }
    };

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Désactiver le rechargement complet lors du focus
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location, onResume, onHide, savePageState]);

  // Restaurer la position de défilement lorsque l'utilisateur revient sur la page
  useEffect(() => {
    if (document.visibilityState === 'visible' && savePageState) {
      try {
        const savedScroll = sessionStorage.getItem('app_last_scroll');
        if (savedScroll) {
          const { x, y } = JSON.parse(savedScroll);
          setTimeout(() => {
            window.scrollTo(x, y);
          }, 100);
        }
      } catch (error) {
        console.warn('Erreur lors de la restauration de la position de défilement:', error);
      }
    }
  }, [savePageState]);

  return {
    isVisible: document.visibilityState === 'visible'
  };
}
