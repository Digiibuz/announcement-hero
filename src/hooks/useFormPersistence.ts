
import { useEffect, useRef } from 'react';
import { UseFormReturn, DefaultValues } from 'react-hook-form';
import { saveToStorage, loadFromStorage, clearStorage } from '../utils/storage';
import { VisibilityHandler } from '../utils/visibilityHandler';
import { SaveThrottler } from '../utils/saveThrottler';

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
  const visibilityHandler = useRef(new VisibilityHandler());
  const saveThrottler = useRef(new SaveThrottler());
  
  const saveData = () => {
    if (!saveThrottler.current.canSave()) {
      if (debug) console.log('Save throttled or in progress');
      return;
    }
    
    saveThrottler.current.startSave();
    try {
      const currentValues = getValues();
      if (currentValues) {
        saveToStorage(storageKey, currentValues);
        if (debug) console.log('Form data saved:', storageKey, currentValues);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      saveThrottler.current.endSave();
    }
  };

  // Save data on changes or interval
  useEffect(() => {
    if (autosaveInterval) {
      const intervalId = setInterval(saveData, autosaveInterval);
      
      const subscription = watch((formValues, { name }) => {
        if (name && allFields.includes(name)) {
          if (debug) console.log('Change detected in field:', name);
          saveData();
        }
      });
      
      return () => {
        clearInterval(intervalId);
        subscription.unsubscribe();
      };
    } else {
      const subscription = watch((formValues, { name, type }) => {
        if (formValues && Object.keys(formValues).length > 0) {
          if (debug && name) console.log('Form data updated:', name, type);
          
          if (!visibilityHandler.current.isPending() && !saveThrottler.current.canSave()) {
            saveToStorage(storageKey, formValues);
          }
        }
      });
      
      const handleBeforeUnload = () => saveData();
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        subscription.unsubscribe();
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [watch, storageKey, autosaveInterval, debug, allFields]);

  // Handle visibility changes
  useEffect(() => {
    const handleVisibility = () => {
      visibilityHandler.current.handleVisibilityChange(
        () => saveData(),
        () => {/* Nothing to do on visible */},
        debug
      );
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      visibilityHandler.current.cleanup();
      saveThrottler.current.cleanup();
    };
  }, [debug]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (!visibilityHandler.current.isPending()) {
        saveData();
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (initialLoadDone.current) return;
    
    const savedData = loadFromStorage<TFormValues>(storageKey);
    if (savedData) {
      try {
        if (debug) console.log('Form data restored:', storageKey, savedData);
        reset(savedData as DefaultValues<TFormValues>, { keepDefaultValues: true });
        initialLoadDone.current = true;
        return;
      } catch (e) {
        console.error('Error loading saved data:', e);
        clearStorage(storageKey);
      }
    }
    
    if (initialValues && Object.keys(initialValues).length > 0) {
      if (debug) console.log('Using initial values');
      reset(initialValues);
    }
    
    initialLoadDone.current = true;
  }, [reset, storageKey, initialValues, debug]);

  return {
    clearSavedData: () => clearStorage(storageKey),
    hasSavedData: () => !!loadFromStorage(storageKey),
    saveData,
    getSavedStep: () => {
      const step = localStorage.getItem(`${storageKey}_step`);
      return step ? parseInt(step, 10) : null;
    }
  };
}
