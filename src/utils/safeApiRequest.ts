
import { toast } from 'sonner';

/**
 * Utilitaire pour effectuer des requêtes POST sécurisées
 * - Encapsule automatiquement les requêtes dans try/catch
 * - Évite les erreurs console
 * - Enregistre les erreurs dans localStorage
 * 
 * @param url URL de la requête
 * @param data Données à envoyer
 * @param options Options supplémentaires pour fetch
 * @param onSuccess Fonction de rappel en cas de succès
 * @param onError Fonction de rappel en cas d'erreur
 */
export async function safePostRequest<T = any, D = any>(
  url: string,
  data: D,
  options: RequestInit = {},
  onSuccess?: (data: T) => void,
  onError?: (message: string) => void
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    if (onSuccess) {
      onSuccess(responseData);
    }
    
    return responseData;
  } catch (error) {
    // Enregistrer l'erreur dans localStorage sans la logger dans la console
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    localStorage.setItem('lastPostError', errorMessage);
    localStorage.setItem('lastPostErrorTimestamp', new Date().toISOString());
    localStorage.setItem('lastPostErrorUrl', url);
    
    // Notification non technique pour l'utilisateur
    if (onError) {
      onError(errorMessage);
    } else {
      toast.error("Une erreur est survenue lors de la communication avec le serveur");
    }
    
    return null;
  }
}

/**
 * Version générique de safePostRequest pour tout type de méthode HTTP
 */
export async function safeApiRequest<T = any, D = any>(
  url: string,
  method: string = 'GET',
  data?: D,
  options: RequestInit = {},
  onSuccess?: (data: T) => void,
  onError?: (message: string) => void
): Promise<T | null> {
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();
    
    if (onSuccess) {
      onSuccess(responseData);
    }
    
    return responseData;
  } catch (error) {
    // Enregistrer l'erreur dans localStorage sans la logger dans la console
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    localStorage.setItem('lastApiError', errorMessage);
    localStorage.setItem('lastApiErrorTimestamp', new Date().toISOString());
    localStorage.setItem('lastApiErrorUrl', url);
    localStorage.setItem('lastApiErrorMethod', method);
    
    // Notification non technique pour l'utilisateur
    if (onError) {
      onError(errorMessage);
    } else {
      toast.error("Une erreur est survenue lors de la communication avec le serveur");
    }
    
    return null;
  }
}
