
import { debounce } from 'lodash';

interface StorageConfig<T> {
  key: string;
  defaultValue: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
  debounceTime?: number;
}

export function createStorageHook<T>({
  key,
  defaultValue,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  debounceTime = 1000,
}: StorageConfig<T>) {
  // Préfixer toutes les clés pour éviter les conflits
  const storageKey = `app_${key}`;
  
  const saveToStorage = debounce((value: T) => {
    try {
      const serialized = serialize(value);
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.warn(`Error saving to localStorage for key ${storageKey}:`, error);
    }
  }, debounceTime);

  const loadFromStorage = (): T => {
    try {
      const item = localStorage.getItem(storageKey);
      if (item === null) return defaultValue;
      return deserialize(item);
    } catch (error) {
      console.warn(`Error loading from localStorage for key ${storageKey}:`, error);
      return defaultValue;
    }
  };

  const clearStorage = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Error clearing localStorage for key ${storageKey}:`, error);
    }
  };

  return {
    saveToStorage,
    loadFromStorage,
    clearStorage
  };
}
