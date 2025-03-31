
/**
 * Utilitaire pour stocker et récupérer des données via le service worker
 * Permet de conserver les données entre les rechargements de page et les changements d'onglets
 */

// Vérifier si le service worker est supporté
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Sauvegarde une valeur dans le cache
 */
export const saveToCache = async (key: string, value: any): Promise<boolean> => {
  try {
    if (!isServiceWorkerSupported) {
      // Fallback sur localStorage si le service worker n'est pas disponible
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    }
    
    // Utiliser le service worker pour stocker la donnée
    const response = await fetch(`/__store?key=${encodeURIComponent(key)}`, {
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
      localStorage.setItem(key, JSON.stringify(value));
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
    if (!isServiceWorkerSupported) {
      // Fallback sur localStorage
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    }
    
    // Utiliser le service worker pour récupérer la donnée
    const response = await fetch(`/__store?key=${encodeURIComponent(key)}`, {
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
      const item = localStorage.getItem(key);
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
    // Toujours supprimer du localStorage par sécurité
    localStorage.removeItem(key);
    
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
