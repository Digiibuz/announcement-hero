
/**
 * Utilitaire pour masquer les informations sensibles dans les messages d'erreur
 */

// Domaines à masquer dans les messages d'erreur
const SENSITIVE_DOMAINS = [
  "supabase.co",
  "supabase.in",
  "lovable.app",
  "lovableproject.com",
  "digiibuz.fr",
  "digii.app",
];

// Mots-clés sensibles à masquer
const SENSITIVE_KEYWORDS = [
  "token",
  "password",
  "auth",
  "key",
  "secret",
  "supabase",
  "preview",
  "login",
  "grant",
  "credentials",
];

// Motifs de regex pour identifier les formats sensibles
const SENSITIVE_PATTERNS = [
  // Format d'ID de projet (séquence de lettres et chiffres)
  /[a-z0-9]{20,22}\.supabase\.co/gi,
  // URLs avec HTTP(S)
  /https?:\/\/[^/\s]+\.supabase\.co[^\s]*/gi,
  // URLs avec auth ou token dans le chemin
  /https?:\/\/[^/]+\/auth\/[^/\s"]*/gi,
  /https?:\/\/[^/]+\/token[^/\s"]*/gi,
  // URLs contenant le mot login
  /https?:\/\/[^/]+\/login[^/\s"]*/gi,
  // Masquer les URLs spécifiques
  /https?:\/\/[a-z0-9-]+\.lovable\.app[^\s]*/gi,
  /https?:\/\/[a-z0-9-]+\.lovableproject\.com[^\s]*/gi,
  /https?:\/\/[a-z0-9.-]+\.digiibuz\.fr[^\s]*/gi,
  /https?:\/\/[a-z0-9.-]+\.digii\.app[^\s]*/gi,
  // Masquer les preview URLs
  /https?:\/\/preview-[a-z0-9-]+\.[^\s\/"]*/gi,
  // Format des jetons JWT
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Masquer les codes d'erreur sensibles
  /(supabase|auth).*error.*code[^\s"]*/gi,
  // Masquer toute requête HTTP (méthode + URL)
  /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+https?:\/\/[^\s]+/gi,
  // Masquer les requêtes d'auth
  /POST\s+https?:\/\/[^\s]*\/auth\/v1\/token[^\s]*/gi,
];

/**
 * Masque toutes les informations sensibles dans un message d'erreur
 * @param message Le message d'erreur ou la chaîne à nettoyer
 * @returns Une version nettoyée du message sans informations sensibles
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "Erreur inconnue";
  
  let sanitizedMessage = message;
  
  try {
    // Appliquer les patterns de masquage sensibles
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitizedMessage = sanitizedMessage.replace(pattern, "[INFORMATION_SENSIBLE_MASQUÉE]");
    });
    
    // Masquer les URLs de domaines sensibles
    SENSITIVE_DOMAINS.forEach(domain => {
      const regex = new RegExp(`https?://[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, "[DOMAINE_MASQUÉ]");
      
      // Masquer aussi juste le nom de domaine
      const domainRegex = new RegExp(`[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(domainRegex, "[DOMAINE_MASQUÉ]");
    });
    
    // Masquer les URLs avec mots-clés sensibles
    SENSITIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`https?://[^\\s]*${keyword}[^\\s]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, `[URL_SENSIBLE_MASQUÉE]`);
      
      // Masquer aussi les chemins d'URL avec le mot-clé
      const pathRegex = new RegExp(`\\/${keyword}[^\\s"',)]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(pathRegex, `/[CHEMIN_SENSIBLE_MASQUÉ]`);
    });
    
    // Masquer spécifiquement les requêtes HTTP
    sanitizedMessage = sanitizedMessage.replace(
      /POST\s+https?:\/\/[^\s]*supabase[^\s]*/gi, 
      "POST [URL_SUPABASE_MASQUÉE]"
    );
    
    // Masquer les erreurs d'authentification
    sanitizedMessage = sanitizedMessage.replace(/invalid[_\s]credentials/gi, "[ERREUR_AUTHENTIFICATION]");
    sanitizedMessage = sanitizedMessage.replace(/Erreur d['']authentification/gi, "[ERREUR_AUTHENTIFICATION]");
  } catch (e) {
    return "Erreur inconnue (détails masqués pour sécurité)";
  }
  
  return sanitizedMessage;
}
