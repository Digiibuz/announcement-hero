
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Hook pour persister les données du formulaire dans le localStorage
 * @param form - Formulaire react-hook-form
 * @param storageKey - Clé de stockage dans le localStorage
 * @param initialValues - Valeurs initiales (optionnelles) pour le formulaire
 * @param autosaveInterval - Intervalle en millisecondes pour la sauvegarde automatique (par défaut: null = sauvegarde à chaque changement)
 */
export function useFormPersistence<TFormValues>(
  form: UseFormReturn<TFormValues>,
  storageKey: string,
  initialValues?: Partial<TFormValues>,
  autosaveInterval: number | null = null
) {
  const { watch, reset } = form;
  const values = watch();

  // Sauvegarder les données dans le localStorage à chaque changement ou à intervalle régulier
  useEffect(() => {
    // Fonction pour sauvegarder les données
    const saveData = () => {
      const currentValues = form.getValues();
      if (currentValues) {
        localStorage.setItem(storageKey, JSON.stringify(currentValues));
        console.log('Données du formulaire sauvegardées:', storageKey);
      }
    };

    // Configuration de la sauvegarde (par changement ou intervalle)
    if (autosaveInterval) {
      // Sauvegarde à intervalle régulier
      const intervalId = setInterval(saveData, autosaveInterval);
      return () => clearInterval(intervalId);
    } else {
      // Sauvegarde à chaque changement
      const subscription = watch((formValues) => {
        if (formValues) {
          localStorage.setItem(storageKey, JSON.stringify(formValues));
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
  }, [watch, storageKey, form, autosaveInterval]);

  // Charger les données depuis le localStorage ou utiliser les valeurs initiales
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
        console.log('Données du formulaire restaurées:', storageKey);
      } catch (e) {
        console.error('Erreur lors de la récupération des données sauvegardées:', e);
        localStorage.removeItem(storageKey);
        if (initialValues) {
          reset(initialValues);
        }
      }
    } else if (initialValues) {
      reset(initialValues);
    }
  }, [reset, storageKey, initialValues]);

  // Fonction pour effacer les données sauvegardées
  const clearSavedData = () => {
    localStorage.removeItem(storageKey);
    console.log('Données sauvegardées effacées:', storageKey);
  };

  return { clearSavedData };
}
