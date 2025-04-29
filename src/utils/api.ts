/**
 * Secure API client for communicating with Supabase via Edge Functions
 * - Handles authentication flows
 * - Manages tokens
 * - Standardizes error handling
 * - Prevents sensitive data exposure in console logs
 */
import { toast } from "@/hooks/use-toast";

// Base API URL (use environment variable if available or fallback)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Custom API error class
export class ApiError extends Error {
  status: number;
  code: string;
  
  constructor(message: string, status: number, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Wrapper for fetch that handles errors and authentication
 */
export async function fetchAPI<T>(
  method: string,
  path: string,
  body?: any,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = localStorage.getItem('access_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Intercepter les erreurs réseau avant qu'elles n'atteignent la console
    const tempErrorHandler = (event: Event | PromiseRejectionEvent) => {
      event.preventDefault();
      // Ne rien afficher, l'erreur sera traitée dans le bloc catch ci-dessous
      return true;
    };
    
    // Installer des gestionnaires temporaires pour les erreurs réseau
    window.addEventListener('error', tempErrorHandler, { once: true });
    window.addEventListener('unhandledrejection', tempErrorHandler, { once: true });
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
      credentials: 'omit', // Don't send cookies
    }).finally(() => {
      // Supprimer les gestionnaires temporaires
      window.removeEventListener('error', tempErrorHandler);
      window.removeEventListener('unhandledrejection', tempErrorHandler);
    });
    
    // Parse JSON response
    const data = await response.json().catch(() => ({}));
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorMessage = data.error || 'Request failed';
      
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.error(`API Error (${response.status}):`, errorMessage);
      }
      
      // Show error in UI
      toast({
        variant: "destructive",
        title: "Operation failed",
        description: getHumanReadableError(errorMessage)
      });
      
      throw new ApiError(errorMessage, response.status);
    }
    
    return data as T;
  } catch (error) {
    // Handle network errors or JSON parsing errors
    if (error instanceof ApiError) {
      throw error; // Re-throw if it's already our custom error
    }
    
    // Only log in development mode with des informations sécurisées
    if (import.meta.env.DEV) {
      console.error('API request failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Show error in UI
    toast({
      variant: "destructive",
      title: "Connection error",
      description: "Could not connect to the server"
    });
    
    throw new ApiError('Network or parsing error', 0);
  }
}

/**
 * Login with email and password
 */
export async function login(email: string, password: string) {
  try {
    // Ajouter un gestionnaire temporaire avant l'appel réseau
    const tempErrorHandler = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      // L'erreur sera traitée dans le bloc catch ci-dessous
      return true;
    };
    
    window.addEventListener('unhandledrejection', tempErrorHandler, { once: true });
    
    const response = await fetchAPI<{ access_token: string; refresh_token: string; user: any }>(
      'POST',
      '/secure-login',
      { email, password }
    ).finally(() => {
      window.removeEventListener('unhandledrejection', tempErrorHandler);
    });
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    return response;
  } catch (error) {
    // Assurer qu'aucun détail sensible n'est exposé
    if (import.meta.env.DEV) {
      console.error('Erreur d\'authentification sécurisée');
    }
    throw new ApiError('INVALID_CREDENTIALS', 401, 'INVALID_CREDENTIALS');
  }
}

/**
 * Refresh authentication token
 */
export async function refreshToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (!refreshToken) {
    throw new ApiError('No refresh token', 401, 'NO_REFRESH_TOKEN');
  }
  
  try {
    const response = await fetchAPI<{ access_token: string; refresh_token: string; user: any }>(
      'POST',
      '/secure-refresh',
      { refresh_token: refreshToken }
    );
    
    // Update tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    return response;
  } catch (error) {
    // If refresh fails, clear tokens and force re-login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    throw error;
  }
}

/**
 * Logout the current user
 */
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  // Redirect to login page or dispatch logout event
  window.location.href = '/login';
}

/**
 * Generic request method for database operations
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE', 
  path: string, 
  body?: any
): Promise<T> {
  try {
    return await fetchAPI<T>('GET', `/secure-db/${path}`, body);
  } catch (error) {
    // Handle token expiration
    if (error instanceof ApiError && error.status === 401) {
      try {
        // Try to refresh the token
        await refreshToken();
        // Retry the original request with new token
        return await fetchAPI<T>('GET', `/secure-db/${path}`, body);
      } catch (refreshError) {
        // If refresh fails, force logout
        logout();
        throw refreshError;
      }
    }
    throw error;
  }
}

/**
 * Convert API error codes to human-readable messages
 */
function getHumanReadableError(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'INVALID_CREDENTIALS': 'Identifiants invalides',
    'INVALID_REFRESH_TOKEN': 'Votre session a expiré',
    'REQUEST_FAILED': 'L\'opération n\'a pas pu être effectuée',
    'UNAUTHORIZED': 'Vous devez être connecté pour accéder à ce contenu',
    'SERVER_ERROR': 'Une erreur inattendue s\'est produite',
    'INVALID_REQUEST': 'Paramètres de requête invalides',
    'METHOD_NOT_ALLOWED': 'Opération non supportée',
    'ID_REQUIRED': 'L\'identifiant de l\'enregistrement est requis',
    'INVALID_PATH': 'Chemin de ressource invalide',
  };
  
  return errorMessages[errorCode] || 'Une erreur est survenue';
}
