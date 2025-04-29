
/**
 * Utilitaires pour masquer les URLs et informations sensibles
 */
import { PROTOCOLS, HTTP_METHODS, SENSITIVE_PATTERNS, SENSITIVE_KEYWORDS, getSensitiveDomains, getSecureAuthErrorMessage } from './sensitiveDataPatterns';

/**
 * Masque toutes les URLs dans un texte, y compris les requêtes HTTP
 * @param text Le texte à nettoyer
 * @returns Le texte nettoyé
 */
export function maskAllUrls(text: string): string {
  if (!text) return text;
  
  // Masquer toutes les requêtes HTTP (MÉTHODE URL) en priorité
  HTTP_METHODS.forEach(method => {
    const methodRegex = new RegExp(`${method}\\s+https?:\\/\\/[^\\s]+`, 'gi');
    text = text.replace(methodRegex, `${method} [URL_MASQUÉE]`);
  });
  
  // Masquer spécifiquement les requêtes POST sensibles (vues dans la console)
  text = text.replace(/POST https?:\/\/[^\s]*supabase[^\s]*/gi, "POST [URL_MASQUÉE]");
  text = text.replace(/POST https?:\/\/[^\s]*auth\/v1\/token[^\s]*/gi, "POST [URL_MASQUÉE]");
  text = text.replace(/POST https?:\/\/[^\s]*token\?grant[^\s]*/gi, "POST [URL_MASQUÉE]");
  text = text.replace(/POST https?:\/\/[^\s]*grant_type=password[^\s]*/gi, "POST [URL_MASQUÉE]");
  
  // Pour chaque protocole, masquer toutes les URLs
  PROTOCOLS.forEach(protocol => {
    let startIndex = text.indexOf(protocol);
    while (startIndex !== -1) {
      // Trouver la fin de l'URL
      let endIndex = text.indexOf(' ', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('"', startIndex);
      if (endIndex === -1) endIndex = text.indexOf("'", startIndex);
      if (endIndex === -1) endIndex = text.indexOf(')', startIndex);
      if (endIndex === -1) endIndex = text.indexOf('}', startIndex);
      if (endIndex === -1) endIndex = text.indexOf(']', startIndex);
      if (endIndex === -1) endIndex = text.length;
      
      // Extraire l'URL
      const url = text.substring(startIndex, endIndex);
      
      // Remplacer par une version masquée
      text = text.replace(url, '[URL_MASQUÉE]');
      
      // Chercher la prochaine occurrence
      startIndex = text.indexOf(protocol, startIndex + 1);
    }
  });
  
  return text;
}

/**
 * Masque les URLs sensibles dans un message d'erreur
 * @param message Le message d'erreur à nettoyer
 * @returns Le message d'erreur nettoyé
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message) return "Erreur inconnue";
  
  let sanitizedMessage = message;
  
  try {
    // Protection spéciale pour les objets JSON (pour éviter les erreurs sur des objets circulaires)
    if (typeof message === 'object') {
      try {
        sanitizedMessage = JSON.stringify(message);
      } catch (e) {
        return "Objet d'erreur complexe (détails masqués)";
      }
    }
    
    // Masquer complètement les messages d'erreur d'authentification
    if (sanitizedMessage.includes("token?grant_type=password") || 
        sanitizedMessage.includes("/auth/v1/token") || 
        sanitizedMessage.includes("401") || 
        sanitizedMessage.includes("400") || 
        sanitizedMessage.includes("grant_type=password") ||
        sanitizedMessage.includes("Bad Request") ||
        sanitizedMessage.includes("Invalid login credentials")) {
      return "[ERREUR_AUTHENTIFICATION]";
    }
    
    // Appliquer maskAllUrls pour un premier niveau de protection
    sanitizedMessage = maskAllUrls(sanitizedMessage);
    
    // Appliquer les patterns de masquage sensibles
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitizedMessage = sanitizedMessage.replace(pattern, "[INFORMATION_SENSIBLE_MASQUÉE]");
    });
    
    // Masquer les URLs de domaines sensibles
    getSensitiveDomains().forEach(domain => {
      // Utilisation de regex plus strictes pour trouver toutes les occurrences du domaine sensible
      const regex = new RegExp(`https?://[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, "[DOMAINE_MASQUÉ]");
      
      // Masquer aussi juste le nom de domaine sans protocole
      const domainRegex = new RegExp(`[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(domainRegex, "[DOMAINE_MASQUÉ]");
    });
    
    // Masquer les URLs qui contiennent des mots-clés sensibles
    SENSITIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`https?://[^\\s]*${keyword}[^\\s]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, `[URL_SENSIBLE_MASQUÉE]`);
      
      // Masquer aussi les chemins d'URL contenant le mot-clé
      const pathRegex = new RegExp(`\/${keyword}[^\\s"',)]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(pathRegex, `/[CHEMIN_SENSIBLE_MASQUÉ]`);
    });
    
    // Masquer toute adresse avec supabase.co, même partielle
    sanitizedMessage = sanitizedMessage.replace(/[a-z0-9-_]+\.supabase\.co/gi, "[PROJET_MASQUÉ].supabase.co");
    
    // Masquer spécifiquement les requêtes HTTP qui contiennent les URLs supabase
    HTTP_METHODS.forEach(method => {
      sanitizedMessage = sanitizedMessage.replace(
        new RegExp(`${method}\\s+https?:\\/\\/[^\\s]*supabase[^\\s]*`, 'gi'), 
        `${method} [URL_SUPABASE_MASQUÉE]`
      );
    });
    
    // Masquer les préfixes preview
    sanitizedMessage = sanitizedMessage.replace(/preview-[a-z0-9-]+/gi, "preview-[ID_MASQUÉ]");
    
    // Masquer les messages d'erreur d'authentification qui pourraient révéler des informations
    sanitizedMessage = sanitizedMessage.replace(/(AuthApiError|AuthError)[^\n]*/gi, "Erreur d'authentification (détails masqués)");
    
    // Masquer spécifiquement les erreurs de connexion avec credentials
    sanitizedMessage = sanitizedMessage.replace(/invalid[_\s]credentials/gi, "[ERREUR_AUTHENTIFICATION]");
    sanitizedMessage = sanitizedMessage.replace(/Invalid login credentials/gi, "[ERREUR_AUTHENTIFICATION]");
    
    // Masquer les erreurs d'authentification en français
    sanitizedMessage = sanitizedMessage.replace(/Erreur d['']authentification/gi, "[ERREUR_AUTHENTIFICATION]");
    sanitizedMessage = sanitizedMessage.replace(/Erreur d'authentification sécurisée/gi, "[ERREUR_AUTHENTIFICATION]");
    sanitizedMessage = sanitizedMessage.replace(/\[ERREUR_AUTHENTIFICATION\]/gi, "[ERREUR_AUTHENTIFICATION]");
    
    // Masquer les codes d'état HTTP et les réponses
    sanitizedMessage = sanitizedMessage.replace(/\d{3} \(Bad Request\)/gi, "[CODE_ÉTAT]");
    sanitizedMessage = sanitizedMessage.replace(/\d{3} \(Unauthorized\)/gi, "[CODE_ÉTAT]");
    
    // Masquer les messages d'erreur spécifiques en français
    sanitizedMessage = sanitizedMessage.replace(/identifiants invalides/gi, "[ERREUR_AUTHENTIFICATION]");
    
    // Masquer tout ce qui pourrait ressembler à un nom de domaine
    sanitizedMessage = sanitizedMessage.replace(/index-[a-zA-Z0-9]+/gi, "[INDEX_MASQUÉ]");
    
  } catch (e) {
    // En cas d'erreur dans le masquage, retourner un message générique
    return "Erreur inconnue (détails masqués pour sécurité)";
  }
  
  return sanitizedMessage;
}

/**
 * Masque les paramètres sensibles dans les URLs
 * @param url L'URL à nettoyer
 * @returns L'URL nettoyée ou une chaîne générique
 */
export function maskSensitiveUrlParams(url: string): string {
  try {
    if (!url) return "[URL_VIDE]";
    
    // Masquer complètement l'URL si elle contient des mots-clés sensibles
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (url.toLowerCase().includes(keyword.toLowerCase())) {
        return "[URL_SENSIBLE_MASQUÉE]";
      }
    }
    
    // Sinon essayer de parser l'URL pour masquer seulement les paramètres sensibles
    const urlObj = new URL(url);
    
    // Masquer le chemin s'il contient des segments sensibles
    if (SENSITIVE_KEYWORDS.some(keyword => urlObj.pathname.toLowerCase().includes(keyword.toLowerCase()))) {
      urlObj.pathname = "/[CHEMIN_MASQUÉ]";
    }
    
    // Masquer tous les paramètres de requête (query parameters)
    if (urlObj.search) {
      urlObj.search = "?[PARAMÈTRES_MASQUÉS]";
    }
    
    // Masquer le hash
    if (urlObj.hash) {
      urlObj.hash = "#[HASH_MASQUÉ]";
    }
    
    return urlObj.toString();
  } catch (e) {
    // En cas d'erreur de parsing, masquer complètement l'URL
    return "[URL_MASQUÉE]";
  }
}
