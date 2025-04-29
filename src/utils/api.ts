
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
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
      credentials: 'omit', // Don't send cookies
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
    
    // Only log in development mode
    if (import.meta.env.DEV) {
      console.error('API request failed:', error.message);
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
    const response = await fetchAPI<{ access_token: string; refresh_token: string; user: any }>(
      'POST',
      '/secure-login',
      { email, password }
    );
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    
    return response;
  } catch (error) {
    // Handle login specific errors
    throw error;
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
    'INVALID_CREDENTIALS': 'Invalid email or password',
    'INVALID_REFRESH_TOKEN': 'Your session has expired',
    'REQUEST_FAILED': 'The operation could not be completed',
    'UNAUTHORIZED': 'You need to log in to access this content',
    'SERVER_ERROR': 'An unexpected error occurred',
    'INVALID_REQUEST': 'Invalid request parameters',
    'METHOD_NOT_ALLOWED': 'Operation not supported',
    'ID_REQUIRED': 'Record identifier is required',
    'INVALID_PATH': 'Invalid resource path',
  };
  
  return errorMessages[errorCode] || 'An error occurred';
}
