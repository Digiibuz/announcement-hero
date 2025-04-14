
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
  const allFields = fields || Object.keys(getValues() || {});
  
  // Fonction pour sauvegarder les données
  const saveData = () => {
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
          if (debug) console.log('Mise à jour des données du formulaire:', name, type);
          localStorage.setItem(storageKey, JSON.stringify(formValues));
          
          // Sauvegarder l'étape courante si disponible
          if (formValues._currentStep !== undefined) {
            localStorage.setItem(`${storageKey}_step`, String(formValues._currentStep));
          }
        }
      });
      
      // Sauvegarde également avant de quitter la page
      const handleBeforeUnload = () => {
        saveData();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Sauvegarder également lors des changements de visibilité (onglet)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          saveData();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        subscription.unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [watch, storageKey, autosaveInterval, debug, saveData, allFields]);

  // Sauvegarder aussi lorsque le composant se démonte
  useEffect(() => {
    return () => {
      saveData();
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
