
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { debounce } from 'lodash';

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
  const formStateRef = useRef<Record<string, any>>({});
  const lastVisibilityState = useRef<string>(document.visibilityState);
  const navigationTypeRef = useRef<string | null>(window.navigationType || null);

  // Fonction optimisée pour sauvegarder l'état du formulaire
  const saveFormState = useCallback(
    debounce(() => {
      try {
        const formData = document.querySelectorAll('input, select, textarea');
        const formState: Record<string, string> = {};
        
        formData.forEach((element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) => {
          if (element.id || element.name) {
            const identifier = element.id || element.name;
            formState[identifier] = element.value;
          }
        });
        
        // Sauvegarder également les attributs data-state des listes déroulantes
        document.querySelectorAll('[data-state]').forEach(element => {
          const id = element.id || '';
          if (id && element.getAttribute('data-state')) {
            formState[`${id}_state`] = element.getAttribute('data-state') || '';
          }
        });
        
        // Stocker l'état complet du formulaire
        if (Object.keys(formState).length > 0) {
          formStateRef.current = formState;
          sessionStorage.setItem('app_form_state', JSON.stringify(formState));
        }
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde de l\'état du formulaire:', error);
      }
    }, 300),
    []
  );

  // Sauvegarder l'état de la page actuelle lorsque l'utilisateur quitte ou change d'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentVisibility = document.visibilityState;
      
      // Éviter les traitements multiples pour le même état
      if (currentVisibility === lastVisibilityState.current) {
        return;
      }
      
      lastVisibilityState.current = currentVisibility;
      const currentlyVisible = currentVisibility === 'visible';
      setIsVisible(currentlyVisible);
      
      if (currentVisibility === 'hidden') {
        // L'utilisateur a quitté la page
        if (savePageState) {
          try {
            // Sauvegarder le chemin et la position de défilement
            const currentPath = location.pathname + location.search + location.hash;
            sessionStorage.setItem('app_last_path', currentPath);
            sessionStorage.setItem('app_last_scroll', JSON.stringify({
              x: window.scrollX,
              y: window.scrollY
            }));
            
            // Sauvegarder l'état du formulaire
            saveFormState();
            
            console.log('État sauvegardé pour:', currentPath);
          } catch (error) {
            console.warn('Erreur lors de la sauvegarde de l\'état de la page:', error);
          }
        }
        
        // Callback personnalisé
        if (onHide) {
          onHide();
        }
      } else if (currentVisibility === 'visible') {
        // L'utilisateur est revenu sur la page - mais ne rechargez PAS la page
        console.log('Application reprise, navigation fluide préservée');
        
        // Callback personnalisé
        if (onResume) {
          onResume();
        }
      }
    };

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Désactiver complètement le rechargement lors du changement d'onglet
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Permettre les navigations réelles mais empêcher les rechargements automatiques
    window.preventReload = true;
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      saveFormState.cancel();
    };
  }, [location, onResume, onHide, savePageState, saveFormState]);

  // Restaurer la position de défilement et l'état du formulaire lorsque l'utilisateur revient sur la page
  useEffect(() => {
    if (document.visibilityState === 'visible' && savePageState) {
      try {
        // Restaurer la position de défilement
        const savedScroll = sessionStorage.getItem('app_last_scroll');
        if (savedScroll && location.pathname === sessionStorage.getItem('app_last_path')) {
          const { x, y } = JSON.parse(savedScroll);
          // Utiliser requestAnimationFrame pour s'assurer que la restauration se fait après le rendu
          window.requestAnimationFrame(() => {
            window.scrollTo(x, y);
          });
        }
        
        // Restaurer l'état du formulaire si présent et si nous sommes sur la même page
        const savedFormState = sessionStorage.getItem('app_form_state');
        const lastPath = sessionStorage.getItem('app_last_path');
        
        if (savedFormState && lastPath === location.pathname + location.search + location.hash) {
          const formState = JSON.parse(savedFormState);
          
          // Attendre que les composants soient montés
          setTimeout(() => {
            // Restaurer les valeurs des champs de formulaire
            Object.entries(formState).forEach(([id, value]) => {
              if (id.endsWith('_state')) {
                // Pour les attributs de données d'état
                const baseId = id.replace('_state', '');
                const element = document.getElementById(baseId);
                if (element) {
                  element.setAttribute('data-state', value as string);
                }
              } else {
                // Pour les champs de formulaire normaux
                const element = document.getElementById(id) || document.getElementsByName(id)[0] as HTMLElement | null;
                if (element && 'value' in element) {
                  (element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value = value as string;
                  
                  // Déclencher un événement de changement pour les composants React
                  const event = new Event('change', { bubbles: true });
                  element.dispatchEvent(event);
                }
              }
            });
          }, 100);
        }
      } catch (error) {
        console.warn('Erreur lors de la restauration de l\'état:', error);
      }
    }
  }, [isVisible, savePageState, location.pathname, location.search, location.hash]);

  return {
    isVisible,
    formState: formStateRef.current
  };
}
