import { useCallback, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { debounce } from 'lodash';

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  formKey: string,
  initialValues?: T | undefined,
  debounceTime: number = 1000,
  debug: boolean = false,
  watchFields?: string[] | undefined
) {
  const storageKey = `app_form_${formKey}`;
  const { watch, reset } = form;

  const saveData = useCallback(
    debounce((data: T) => {
      try {
        if (debug) console.log(`Saving form data for ${formKey}:`, data);
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (error) {
        console.warn(`Error saving form data for ${formKey}:`, error);
      }
    }, debounceTime),
    [storageKey, debounceTime, debug]
  );

  const loadForm = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (debug) console.log(`Loading form data for ${formKey}:`, data);
        reset(data);
        return true;
      }
    } catch (error) {
      console.warn(`Error loading form data for ${formKey}:`, error);
    }
    return false;
  }, [storageKey, reset, debug]);

  const clearSavedForm = useCallback(() => {
    try {
      if (debug) console.log(`Clearing form data for ${formKey}`);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Error clearing form data for ${formKey}:`, error);
    }
  }, [storageKey, debug]);

  const clearSavedData = clearSavedForm;
  const hasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved !== null && saved !== undefined;
    } catch {
      return false;
    }
  }, [storageKey]);

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      return;
    }
    
    loadForm();
  }, [initialValues, loadForm, reset]);

  useEffect(() => {
    const subscription = watch((data, { name, type }) => {
      if (debug) console.log(`Form changed: ${name} (${type})`, data);
      
      if (Object.keys(data).length > 0) {
        if (!watchFields || !name || watchFields.includes(name)) {
          saveData(data as T);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, saveData, debug, watchFields]);

  return {
    loadForm,
    clearSavedForm,
    clearSavedData,
    hasSavedData,
    saveData
  };
}
