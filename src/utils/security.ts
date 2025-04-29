
/**
 * Utilitaire pour masquer les informations sensibles dans les messages d'erreur
 */

// Liste des domaines sensibles à masquer
const SENSITIVE_DOMAINS = [
  'supabase.co',
  'rdwqedmvzicerwotjseg'
];

/**
 * Masque les URLs sensibles dans un message d'erreur
 * @param message Le message d'erreur à nettoyer
 * @returns Le message d'erreur nettoyé
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "Erreur inconnue";
  
  let sanitizedMessage = message;
  
  // Masquer les URLs de projet Supabase potentielles
  SENSITIVE_DOMAINS.forEach(domain => {
    // Utilisation de regex pour trouver toutes les occurrences du domaine sensible
    const regex = new RegExp(`https?://[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
    sanitizedMessage = sanitizedMessage.replace(regex, "https://[PROJET_MASQUÉ]");
  });
  
  // Masquer les jetons d'authentification potentiels (format JWT)
  sanitizedMessage = sanitizedMessage.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[JETON_MASQUÉ]");
  
  return sanitizedMessage;
}

/**
 * Wrapper pour console.error qui masque les informations sensibles
 * @param message Le message d'erreur
 * @param args Arguments supplémentaires
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  const sanitizedMessage = sanitizeErrorMessage(message);
  console.error(sanitizedMessage, ...args);
}

/**
 * Intercepte une erreur et la traite de manière sécurisée
 * @param error L'erreur à traiter
 * @returns Un message d'erreur convivial et sécurisé
 */
export function handleAuthError(error: any): string {
  // Ne pas afficher l'erreur complète dans la console
  safeConsoleError("Erreur d'authentification sécurisée:", error);
  
  // Traduire les codes d'erreur communs de Supabase
  if (error?.message?.includes('Invalid login credentials')) {
    return "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
  } else if (error?.message?.includes('Email not confirmed')) {
    return "Email non confirmé. Veuillez vérifier votre boîte de réception.";
  } else if (error?.message?.includes('rate limit')) {
    return "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
  }
  
  // Message générique pour toute autre erreur
  return "Échec de la connexion. Veuillez réessayer.";
}
