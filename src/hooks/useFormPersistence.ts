
import { useCallback, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { debounce } from 'lodash';

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  formKey: string,
  options = { debounceTime: 1000 }
) {
  const storageKey = `app_form_${formKey}`;
  const { watch, reset } = form;

  const saveForm = useCallback(
    debounce((data: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn(`Error saving form data for ${formKey}:`, error);
      }
    }, options.debounceTime),
    [storageKey]
  );

  const loadForm = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        reset(data);
        return true;
      }
    } catch (error) {
      console.warn(`Error loading form data for ${formKey}:`, error);
    }
    return false;
  }, [storageKey, reset]);

  const clearSavedForm = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Error clearing form data for ${formKey}:`, error);
    }
  }, [storageKey]);

  useEffect(() => {
    const subscription = watch((data) => {
      if (Object.keys(data).length > 0) {
        saveForm(data as T);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, saveForm]);

  return {
    loadForm,
    clearSavedForm
  };
}
