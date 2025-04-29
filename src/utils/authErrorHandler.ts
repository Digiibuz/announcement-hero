
/**
 * Gestionnaire d'erreurs d'authentification
 */
import { safeConsoleError } from './logSanitizer';

/**
 * Intercepte une erreur et la traite de manière sécurisée
 * @param error L'erreur à traiter
 * @returns Un message d'erreur convivial et sécurisé
 */
export function handleAuthError(error: any): string {
  // Ne pas afficher l'erreur complète dans la console
  safeConsoleError("[ERREUR_AUTHENTIFICATION]:", error);
  
  // Ne jamais afficher de messages d'erreur trop spécifiques
  // Traduire les codes d'erreur communs de Supabase
  if (error?.message?.includes('Invalid login credentials') || 
      error?.message?.includes('invalid') ||
      error?.status === 400 || 
      error?.message?.includes('Bad Request')) {
    return "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
  } else if (error?.message?.includes('Email not confirmed')) {
    return "Email non confirmé. Veuillez vérifier votre boîte de réception.";
  } else if (error?.message?.includes('rate limit')) {
    return "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
  }
  
  // Message générique pour toute autre erreur - ne jamais donner de détails spécifiques
  return "Échec de la connexion. Veuillez réessayer.";
}
