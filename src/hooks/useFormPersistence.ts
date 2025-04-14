
import { useEffect, useRef } from 'react';
import { UseFormReturn, DefaultValues } from 'react-hook-form';

/**
 * Hook pour persister les données du formulaire dans le localStorage
 * @param form - Formulaire react-hook-form
 * @param storageKey - Clé de stockage dans le localStorage
 * @param initialValues - Valeurs initiales (optionnelles) pour le formulaire
 * @param autosaveInterval - Intervalle en millisecondes pour la sauvegarde automatique (par défaut: null = sauvegarde à chaque changement)
 * @param debug - Afficher les logs de debug (par défaut: false)
 * @param fields - Liste des champs spécifiques à surveiller (par défaut: tous les champs)
 */
export function useFormPersistence<TFormValues extends Record<string, any>>(
  form: UseFormReturn<TFormValues>,
  storageKey: string,
  initialValues?: DefaultValues<TFormValues>,
  autosaveInterval: number | null = null,
  debug: boolean = false,
  fields?: string[]
) {
  const { watch, reset, getValues } = form;
  const initialLoadDone = useRef(false);
  const visibilityChangePending = useRef(false);
  const lastVisibilityChangeTime = useRef(0);
  const allFields = fields || Object.keys(getValues() || {});
  const visibilityChangeTimerRef = useRef<number | null>(null);
  const saveInProgressRef = useRef(false);
  const saveThrottleTimerRef = useRef<number | null>(null);
  const visibilityChangeCount = useRef(0);
  
  // Fonction pour sauvegarder les données avec throttling
  const saveData = () => {
    // Si un timer de throttling est en cours, ne pas déclencher une nouvelle sauvegarde
    if (saveThrottleTimerRef.current !== null) {
      if (debug) console.log('Sauvegarde throttled, timer déjà en cours');
      return;
    }
    
    // Si une sauvegarde est déjà en cours ou si un changement de visibilité est en cours de traitement, ne pas déclencher de sauvegarde
    if (visibilityChangePending.current || saveInProgressRef.current) {
      if (debug) console.log('Sauvegarde ignorée pendant le traitement du changement de visibilité ou sauvegarde déjà en cours');
      return;
    }
    
    // Mettre en place le throttling pour éviter les sauvegardes trop fréquentes
    saveThrottleTimerRef.current = window.setTimeout(() => {
      saveThrottleTimerRef.current = null;
    }, 500); // 500ms de throttling
    
    saveInProgressRef.current = true;
    
    try {
      const currentValues = getValues();
      
      if (currentValues && Object.keys(currentValues).length > 0) {
        // Vérifier que les données ne sont pas vides avant de sauvegarder
        let hasNonEmptyValues = false;
        
        for (const key of Object.keys(currentValues)) {
          const value = currentValues[key];
          if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value) ? value.length > 0 : true) {
              hasNonEmptyValues = true;
              break;
            }
          }
        }
        
        if (hasNonEmptyValues) {
          localStorage.setItem(storageKey, JSON.stringify(currentValues));
          if (debug) console.log('Données du formulaire sauvegardées:', storageKey, currentValues);
          
          // Également sauvegarder l'étape courante si nous sommes dans un formulaire multi-étapes
          if (currentValues.hasOwnProperty('_currentStep')) {
            localStorage.setItem(`${storageKey}_step`, String(currentValues._currentStep));
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
    } finally {
      saveInProgressRef.current = false;
    }
  };

  // Sauvegarder les données dans le localStorage à chaque changement ou à intervalle régulier
  useEffect(() => {
    // Configuration de la sauvegarde (par changement ou intervalle)
    if (autosaveInterval) {
      // Sauvegarde à intervalle régulier
      const intervalId = setInterval(saveData, autosaveInterval);
      
      // Aussi sauvegarder sur les changements importants
      const subscription = watch((formValues, { name }) => {
        // Si un champ important a changé, sauvegarder immédiatement
        if (name && allFields.includes(name)) {
          if (debug) console.log('Changement détecté dans le champ:', name);
          saveData();
        }
      });
      
      return () => {
        clearInterval(intervalId);
        subscription.unsubscribe();
      };
    } else {
      // Sauvegarde à chaque changement
      const subscription = watch((formValues, { name, type }) => {
        if (formValues && Object.keys(formValues).length > 0) {
          if (debug && name) console.log('Mise à jour des données du formulaire:', name, type);
          
          // Vérifier si nous sommes en train de traiter un changement de visibilité
          // Si oui, ne pas déclencher de sauvegarde supplémentaire pour éviter les boucles
          if (!visibilityChangePending.current && !saveInProgressRef.current) {
            localStorage.setItem(storageKey, JSON.stringify(formValues));
            
            // Sauvegarder l'étape courante si disponible
            if (formValues._currentStep !== undefined) {
              localStorage.setItem(`${storageKey}_step`, String(formValues._currentStep));
            }
          }
        }
      });
      
      // Sauvegarde également avant de quitter la page
      const handleBeforeUnload = () => {
        saveData();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        subscription.unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [watch, storageKey, autosaveInterval, debug, allFields]);

  // Gestion améliorée des changements de visibilité (onglet) dans un effet séparé
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Protection contre les boucles infinies potentielles
      visibilityChangeCount.current += 1;
      if (visibilityChangeCount.current > 5) {
        console.error("Trop de changements de visibilité détectés en peu de temps, ignorant cet événement");
        // Réinitialisation du compteur après un certain temps
        setTimeout(() => {
          visibilityChangeCount.current = 0;
        }, 2000);
        return;
      }
      
      const now = Date.now();
      
      // Anti-rate limiting: ignorer les changements trop rapprochés (moins de 300ms)
      if (now - lastVisibilityChangeTime.current < 300) {
        if (debug) console.log('Changement de visibilité ignoré (trop rapproché)');
        return;
      }
      
      lastVisibilityChangeTime.current = now;
      
      // Nettoyer tout timer existant pour éviter les appels multiples
      if (visibilityChangeTimerRef.current !== null) {
        clearTimeout(visibilityChangeTimerRef.current);
        visibilityChangeTimerRef.current = null;
      }
      
      if (document.visibilityState === 'hidden') {
        // Quand on quitte l'onglet, sauvegarder
        if (debug) console.log('Onglet caché, sauvegarde des données');
        saveData();
        visibilityChangePending.current = false;
      } else if (document.visibilityState === 'visible' && !visibilityChangePending.current) {
        // Quand on revient sur l'onglet
        if (debug) console.log('Onglet visible, marquage du changement de visibilité en cours');
        visibilityChangePending.current = true;
        
        // Utiliser un timer pour l'action de visibilité pour éviter les boucles
        visibilityChangeTimerRef.current = window.setTimeout(() => {
          // Ici on peut effectuer des actions nécessaires au retour sur l'onglet
          if (debug) console.log('Fin du traitement du changement de visibilité');
          visibilityChangePending.current = false;
          visibilityChangeTimerRef.current = null;
          
          // Réinitialiser le compteur après un traitement réussi
          setTimeout(() => {
            visibilityChangeCount.current = 0;
          }, 500);
        }, 1000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityChangeTimerRef.current !== null) {
        clearTimeout(visibilityChangeTimerRef.current);
      }
      if (saveThrottleTimerRef.current !== null) {
        clearTimeout(saveThrottleTimerRef.current);
      }
    };
  }, [debug]);

  // Sauvegarder aussi lorsque le composant se démonte
  useEffect(() => {
    return () => {
      if (!visibilityChangePending.current && !saveInProgressRef.current) {
        saveData();
      }
    };
  }, []);

  // Charger les données depuis le localStorage ou utiliser les valeurs initiales
  useEffect(() => {
    // Ne charger les données qu'une seule fois au montage du composant
    if (initialLoadDone.current) return;
    
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          if (debug) console.log('Données du formulaire restaurées:', storageKey, parsedData);
          
          // Vérifier s'il y a une étape sauvegardée
          const savedStep = localStorage.getItem(`${storageKey}_step`);
          if (savedStep) {
            parsedData._currentStep = parseInt(savedStep, 10);
          }
          
          // Utiliser la réinitialisation avec le second paramètre pour indiquer de préserver les valeurs par défaut
          reset(parsedData as DefaultValues<TFormValues>, { keepDefaultValues: true });
          
          initialLoadDone.current = true;
          return;
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des données sauvegardées:', e);
        localStorage.removeItem(storageKey);
      }
    }
    
    // Si pas de données sauvegardées valides, utiliser les valeurs initiales
    if (initialValues && Object.keys(initialValues).length > 0) {
      if (debug) console.log('Utilisation des valeurs initiales');
      reset(initialValues);
    }
    
    initialLoadDone.current = true;
  }, [reset, storageKey, initialValues, debug]);

  // Fonction pour effacer les données sauvegardées
  const clearSavedData = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_step`);
    if (debug) console.log('Données sauvegardées effacées:', storageKey);
  };

  // Vérifier si des données sont sauvegardées
  const hasSavedData = () => {
    const savedData = localStorage.getItem(storageKey);
    return !!savedData;
  };

  // Récupérer l'étape sauvegardée
  const getSavedStep = (): number | null => {
    const savedStep = localStorage.getItem(`${storageKey}_step`);
    return savedStep ? parseInt(savedStep, 10) : null;
  };

  return { 
    clearSavedData,
    hasSavedData,
    saveData,
    getSavedStep
  };
}
