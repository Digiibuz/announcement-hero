
import { useState, useEffect, useCallback } from 'react';
import { createStorageHook } from '@/utils/persistenceUtils';

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options: {
    debounceTime?: number;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const storage = createStorageHook({
    key,
    defaultValue,
    ...options
  });

  const [state, setState] = useState<T>(() => storage.loadFromStorage());

  useEffect(() => {
    storage.saveToStorage(state);
  }, [state]);

  const clearPersistedState = useCallback(() => {
    storage.clearStorage();
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState, clearPersistedState] as const;
}
