
import { useEffect, useState } from 'react';
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
  const [isVisible, setIsVisible] = useState<boolean>(document.visibilityState === 'visible');

  // Sauvegarder l'état de la page actuelle lorsque l'utilisateur quitte ou change d'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentlyVisible = document.visibilityState === 'visible';
      setIsVisible(currentlyVisible);
      
      if (document.visibilityState === 'hidden') {
        // L'utilisateur a quitté la page
        if (savePageState) {
          try {
            sessionStorage.setItem('app_last_path', location.pathname + location.search + location.hash);
            sessionStorage.setItem('app_last_scroll', JSON.stringify({
              x: window.scrollX,
              y: window.scrollY
            }));
            
            // Stocker d'autres informations d'état si nécessaire
            const formData = document.querySelectorAll('input, select, textarea');
            const formState: Record<string, string> = {};
            formData.forEach((element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
              if (element.id) {
                formState[element.id] = element.value;
              }
            });
            
            if (Object.keys(formState).length > 0) {
              sessionStorage.setItem('app_form_state', JSON.stringify(formState));
            }
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
    
    // Prévenir le rechargement lors du changement d'onglet
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Ne pas interrompre la navigation réelle
      if (!document.hidden) return;
      
      // Empêcher le rechargement lors du changement d'onglet
      event.preventDefault();
      return (event.returnValue = '');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location, onResume, onHide, savePageState]);

  // Restaurer la position de défilement et l'état du formulaire lorsque l'utilisateur revient sur la page
  useEffect(() => {
    if (document.visibilityState === 'visible' && savePageState) {
      try {
        // Restaurer la position de défilement
        const savedScroll = sessionStorage.getItem('app_last_scroll');
        if (savedScroll) {
          const { x, y } = JSON.parse(savedScroll);
          setTimeout(() => {
            window.scrollTo(x, y);
          }, 100);
        }
        
        // Restaurer l'état du formulaire si présent
        const savedFormState = sessionStorage.getItem('app_form_state');
        if (savedFormState) {
          const formState = JSON.parse(savedFormState);
          Object.entries(formState).forEach(([id, value]) => {
            const element = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
            if (element) {
              element.value = value as string;
            }
          });
        }
      } catch (error) {
        console.warn('Erreur lors de la restauration de l\'état:', error);
      }
    }
  }, [isVisible, savePageState]);

  return {
    isVisible
  };
}
