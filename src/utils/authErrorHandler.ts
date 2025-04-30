
/**
 * Gestion sécurisée des erreurs d'authentification
 * - Ne contient aucun log vers la console
 * - Ne révèle pas d'URLs ou d'informations sensibles
 */

/**
 * Gère les erreurs d'authentification de manière sécurisée
 * @param error L'erreur à traiter
 * @returns Un message d'erreur générique
 */
export function handleAuthError(error: any): string {
  // Ne jamais logger l'erreur originale, retourner un message générique
  return "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
}

/**
 * Version sécurisée de console.error qui ne permet pas d'afficher d'informations sensibles
 * @param message Message d'erreur
 */
export function safeConsoleError(message: string): void {
  // Bloquer complètement les logs contenant des termes sensibles
  const sensitivePatterns = [
    /supabase\.co/i,
    /auth\/v1\/token/i,
    /token\?grant_type=password/i,
    /400.*bad request/i,
    /401/i,
    /grant_type=password/i,
    /rdwqedmvzicerwotjseg/i,
    /index-[a-zA-Z0-9-_]+\.js/i
  ];
  
  // Vérifier si le message contient des informations sensibles
  if (sensitivePatterns.some(pattern => pattern.test(message))) {
    return; // Ne rien afficher
  }
  
  // Pour les messages non sensibles uniquement
  console.error("[ERREUR_SÉCURISÉE]");
}
