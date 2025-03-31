
/**
 * Utilitaire pour stocker et récupérer des données via le service worker
 * Permet de conserver les données entre les rechargements de page et les changements d'onglets
 */

// Current cache version - change this when making breaking changes
const CACHE_VERSION = 'v3'; // Incremented for fresh start

// Vérifier si le service worker est supporté
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Sauvegarde une valeur dans le cache
 */
export const saveToCache = async (key: string, value: any): Promise<boolean> => {
  try {
    // Add version and timestamp to key to invalidate cache on version changes
    const versionedKey = `${CACHE_VERSION}:${key}:${Date.now()}`;
    
    if (!isServiceWorkerSupported) {
      // Fallback sur localStorage si le service worker n'est pas disponible
      localStorage.setItem(versionedKey, JSON.stringify(value));
      return true;
    }
    
    // Utiliser le service worker pour stocker la donnée
    const response = await fetch(`/__store?key=${encodeURIComponent(versionedKey)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la sauvegarde dans le cache');
    }
    
    return true;
  } catch (error) {
    console.error('Erreur de cache:', error);
    // Fallback sur localStorage
    try {
      const versionedKey = `${CACHE_VERSION}:${key}:${Date.now()}`;
      localStorage.setItem(versionedKey, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Erreur localStorage:', e);
      return false;
    }
  }
};

/**
 * Récupère une valeur depuis le cache
 */
export const getFromCache = async <T>(key: string, defaultValue?: T): Promise<T | null> => {
  try {
    // Get latest value with this version and key prefix
    const prefix = `${CACHE_VERSION}:${key}`;
    
    if (!isServiceWorkerSupported) {
      // Fallback sur localStorage
      // Find the most recent key matching our prefix
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      if (keys.length === 0) return defaultValue || null;
      
      // Sort by timestamp (which is at the end of the key)
      keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':')[2] || '0');
        const timestampB = parseInt(b.split(':')[2] || '0');
        return timestampB - timestampA;
      });
      
      const item = localStorage.getItem(keys[0]);
      return item ? JSON.parse(item) : defaultValue || null;
    }
    
    // Utiliser le service worker pour récupérer la donnée
    const response = await fetch(`/__store?key=${encodeURIComponent(prefix)}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération depuis le cache');
    }
    
    const data = await response.json();
    return data || defaultValue || null;
  } catch (error) {
    console.error('Erreur de cache:', error);
    // Fallback sur localStorage
    try {
      const prefix = `${CACHE_VERSION}:${key}`;
      const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      if (keys.length === 0) return defaultValue || null;
      
      // Sort by timestamp (which is at the end of the key)
      keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':')[2] || '0');
        const timestampB = parseInt(b.split(':')[2] || '0');
        return timestampB - timestampA;
      });
      
      const item = localStorage.getItem(keys[0]);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (e) {
      console.error('Erreur localStorage:', e);
      return defaultValue || null;
    }
  }
};

/**
 * Supprime une valeur du cache
 */
export const removeFromCache = async (key: string): Promise<boolean> => {
  try {
    // Remove all keys with this prefix
    const prefix = `${CACHE_VERSION}:${key}`;
    
    // Nettoyer localStorage 
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(prefix)) {
        localStorage.removeItem(k);
      }
    });
    
    if (!isServiceWorkerSupported) {
      return true;
    }
    
    // Enregistrer null dans le cache du service worker pour "supprimer"
    await saveToCache(key, null);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du cache:', error);
    return false;
  }
};

/**
 * Nettoie les caches obsolètes (anciennes versions)
 */
export const cleanupCache = (): void => {
  try {
    // Nettoyer localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith(`${CACHE_VERSION}:`)) {
        localStorage.removeItem(key);
      }
    }
    
    // Pas de nettoyage pour le service worker ici car il est géré dans l'événement 'activate'
  } catch (error) {
    console.error('Erreur lors du nettoyage du cache:', error);
  }
};

// Cleanup cache on load
cleanupCache();
