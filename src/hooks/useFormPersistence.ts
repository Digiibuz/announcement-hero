
import { useEffect, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Hook pour persister les données du formulaire dans le localStorage
 * @param form - Formulaire react-hook-form
 * @param storageKey - Clé de stockage dans le localStorage
 * @param initialValues - Valeurs initiales (optionnelles) pour le formulaire
 * @param autosaveInterval - Intervalle en millisecondes pour la sauvegarde automatique (par défaut: null = sauvegarde à chaque changement)
 * @param debug - Afficher les logs de debug (par défaut: false)
 */
export function useFormPersistence<TFormValues extends Record<string, any>>(
  form: UseFormReturn<TFormValues>,
  storageKey: string,
  initialValues?: Partial<TFormValues>,
  autosaveInterval: number | null = null,
  debug: boolean = false
) {
  const { watch, reset, getValues } = form;
  const initialLoadDone = useRef(false);
  
  // Fonction pour sauvegarder les données
  const saveData = () => {
    const currentValues = getValues();
    if (currentValues && Object.keys(currentValues).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(currentValues));
      if (debug) console.log('Données du formulaire sauvegardées:', storageKey);
    }
  };

  // Sauvegarder les données dans le localStorage à chaque changement ou à intervalle régulier
  useEffect(() => {
    // Configuration de la sauvegarde (par changement ou intervalle)
    if (autosaveInterval) {
      // Sauvegarde à intervalle régulier
      const intervalId = setInterval(saveData, autosaveInterval);
      return () => clearInterval(intervalId);
    } else {
      // Sauvegarde à chaque changement
      const subscription = watch((formValues) => {
        if (formValues && Object.keys(formValues).length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(formValues));
          if (debug) console.log('Données du formulaire mises à jour:', storageKey);
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
  }, [watch, storageKey, autosaveInterval, debug]);

  // Charger les données depuis le localStorage ou utiliser les valeurs initiales
  useEffect(() => {
    // Ne charger les données qu'une seule fois au montage du composant
    if (initialLoadDone.current) return;
    
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && Object.keys(parsedData).length > 0) {
          reset(parsedData);
          if (debug) console.log('Données du formulaire restaurées:', storageKey);
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
      reset(initialValues);
      initialLoadDone.current = true;
    }
  }, [reset, storageKey, initialValues, debug]);

  // Fonction pour effacer les données sauvegardées
  const clearSavedData = () => {
    localStorage.removeItem(storageKey);
    if (debug) console.log('Données sauvegardées effacées:', storageKey);
  };

  // Vérifier si des données sont sauvegardées
  const hasSavedData = () => {
    const savedData = localStorage.getItem(storageKey);
    return !!savedData;
  };

  return { 
    clearSavedData,
    hasSavedData,
    saveData
  };
}
