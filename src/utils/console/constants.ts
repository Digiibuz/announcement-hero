
/**
 * Constants used across the console security modules
 */

// Liste des patterns sensibles à remplacer complètement
export const SENSITIVE_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /grant_type=password/i,
  /rdwqedmvzicerwotjseg/i,
  /index-[a-zA-Z0-9-_]+\.js/i
];

/**
 * Remplace complètement l'URL originale par une URL factice
 */
export function replaceWithFakeUrl(originalUrl: string): string {
  return "https://api-secure.example.com/auth/session";
}
