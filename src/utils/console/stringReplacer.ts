
/**
 * Utilities for replacing sensitive strings in logs
 */

// Fake URL to use as replacement
const FAKE_URL = 'https://api-secure.example.com/auth';

/**
 * Remplace toutes les URLs sensibles dans une chaîne
 */
export function replaceAllSensitiveUrls(str: string): string {
  if (!str) return str;
  
  let result = str;
  
  // Liste des URLs sensibles à remplacer
  const SENSITIVE_URLS = [
    'supabase.co',
    'auth/v1/token',
    'token?grant_type=password',
    'grant_type=password',
    'rdwqedmvzicerwotjseg'
  ];
  
  // Remplacer toutes les URLs HTTP(S) sensibles
  for (const sensitiveUrl of SENSITIVE_URLS) {
    // URL complète avec protocole
    const httpRegex = new RegExp(`https?://[^\\s"']*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(httpRegex, FAKE_URL);
    
    // Partie d'URL sans protocole
    const partRegex = new RegExp(`[^\\s"'/]*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(partRegex, 'api-secure.example.com');
  }
  
  // Remplacer les requêtes HTTP avec méthode
  const methodRegex = /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+https?:\/\/[^\s"']*/gi;
  result = result.replace(methodRegex, '$1 ' + FAKE_URL);
  
  // Remplacer les codes d'erreur HTTP
  result = result.replace(/400\s*\(Bad Request\)/gi, '[ERREUR_HTTP]');
  result = result.replace(/401\s*\(Unauthorized\)/gi, '[ERREUR_HTTP]');
  
  // Remplacer les références aux fichiers JS minifiés
  result = result.replace(/index-[a-zA-Z0-9_-]+\.js/gi, 'app.js');
  
  return result;
}
