
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

/**
 * Hook pour persister les données du formulaire dans le localStorage
 * @param form - Formulaire react-hook-form
 * @param storageKey - Clé de stockage dans le localStorage
 * @param initialValues - Valeurs initiales (optionnelles) pour le formulaire
 */
export function useFormPersistence<TFormValues>(
  form: UseFormReturn<TFormValues>,
  storageKey: string,
  initialValues?: Partial<TFormValues>
) {
  const { watch, reset } = form;
  const values = watch();

  // Sauvegarder les données dans le localStorage à chaque changement
  useEffect(() => {
    const subscription = watch((formValues) => {
      if (formValues) {
        localStorage.setItem(storageKey, JSON.stringify(formValues));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [watch, storageKey]);

  // Charger les données depuis le localStorage ou utiliser les valeurs initiales
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
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
  };

  return { clearSavedData };
}
