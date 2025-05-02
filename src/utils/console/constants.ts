
/**
 * Constants used across the console security modules
 */

// Liste des patterns d'URL sensibles à masquer complètement
export const SENSITIVE_URL_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /grant_type=password/i,
  /rdwqedmvzicerwotjseg/i
];

// Shared patterns for all security modules
export const SENSITIVE_PATTERNS = [
  ...SENSITIVE_URL_PATTERNS,
  /index-[a-zA-Z0-9-_]+\.js/i,
  /auth\/v1/i
];

// Liste des requêtes à bloquer complètement dans l'inspecteur réseau
export const CRITICAL_URLS_TO_BLOCK = [
  'auth/v1/token',
  'token?grant_type=password',
  'grant_type=password',
  'auth/v1',
  'rdwqedmvzicerwotjseg'
];

/**
 * Vérifie si une URL contient des patterns extrêmement sensibles qui doivent être bloqués
 */
export function shouldCompletelyBlockRequest(url: string): boolean {
  return CRITICAL_URLS_TO_BLOCK.some(pattern => url.includes(pattern));
}

/**
 * Remplace l'URL originale par une URL sécurisée qui n'expose pas d'informations sensibles
 */
export function createSecureUrl(originalUrl: string): string {
  return "https://api-secure.example.com/auth";
}
