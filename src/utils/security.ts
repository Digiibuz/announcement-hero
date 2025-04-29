
/**
 * Utilitaire pour masquer les informations sensibles dans les messages d'erreur
 */

// Éviter de stocker directement les domaines sensibles sous forme de chaînes brutes
// Utiliser une fonction qui génère dynamiquement les valeurs sensibles
function getSensitiveDomains(): string[] {
  // Obfusquer les domaines pour rendre plus difficile l'extraction statique
  const domains = [
    atob('c3VwYWJhc2UuY28='), // supabase.co encodé en base64
    // Ne pas stocker directement l'ID du projet, il sera détecté par regex pattern
  ];
  return domains;
}

// Liste des mots-clés sensibles à détecter
const SENSITIVE_KEYWORDS = [
  'token',
  'password',
  'auth',
  'key',
  'secret'
];

// Patterns regex pour identifier les formats sensibles
const SENSITIVE_PATTERNS = [
  // Format d'ID de projet Supabase (séquence de lettres et chiffres de longueur typique)
  /[a-z0-9]{20,22}\.supabase\.co/gi,
  // Format plus précis avec HTTP(S)
  /https?:\/\/[a-z0-9]{10,50}\.supabase\.co[^\s]*/gi,
  // Format pour les chemins d'API Supabase
  /supabase\.co\/auth\/v1/gi,
  // URLs avec auth ou token dans le chemin
  /https?:\/\/[^/]+\/auth\/[^/\s"]*/gi,
  /https?:\/\/[^/]+\/token[^/\s"]*/gi,
  // Format des jetons JWT
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Masquer les codes d'erreur qui pourraient contenir des informations sensibles
  /(supabase|auth).*error.*code[^\s"]*/gi,
];

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
    
    // Appliquer les patterns de masquage sensibles
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitizedMessage = sanitizedMessage.replace(pattern, "[INFORMATION_SENSIBLE_MASQUÉE]");
    });
    
    // Masquer les URLs de domaines sensibles
    getSensitiveDomains().forEach(domain => {
      // Utilisation de regex plus strictes pour trouver toutes les occurrences du domaine sensible
      const regex = new RegExp(`https?://[a-zA-Z0-9-_.]*${domain}[a-zA-Z0-9-_.:/]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, "https://[PROJET_MASQUÉ]");
    });
    
    // Masquer les URLs qui contiennent des mots-clés sensibles
    SENSITIVE_KEYWORDS.forEach(keyword => {
      const regex = new RegExp(`https?://[^\\s]*${keyword}[^\\s]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(regex, `https://[URL_SENSIBLE_MASQUÉE]`);
      
      // Masquer aussi les chemins d'URL contenant le mot-clé
      const pathRegex = new RegExp(`\/${keyword}[^\\s"',)]*`, 'gi');
      sanitizedMessage = sanitizedMessage.replace(pathRegex, `/[CHEMIN_SENSIBLE_MASQUÉ]`);
    });
    
    // Masquer toute adresse avec supabase.co, même partielle
    sanitizedMessage = sanitizedMessage.replace(/[a-z0-9-_]+\.supabase\.co/gi, "[PROJET_MASQUÉ].supabase.co");
    
    // Masquer spécifiquement les requêtes HTTP qui contiennent les URLs supabase
    sanitizedMessage = sanitizedMessage.replace(/POST https?:\/\/[^\s]*supabase[^\s]*/gi, "POST https://[PROJET_MASQUÉ].supabase.co/[CHEMIN_MASQUÉ]");
    sanitizedMessage = sanitizedMessage.replace(/GET https?:\/\/[^\s]*supabase[^\s]*/gi, "GET https://[PROJET_MASQUÉ].supabase.co/[CHEMIN_MASQUÉ]");
    
    // Masquer les messages d'erreur d'authentification qui pourraient révéler des informations
    sanitizedMessage = sanitizedMessage.replace(/(AuthApiError|AuthError)[^\n]*/gi, "Erreur d'authentification (détails masqués)");
    
  } catch (e) {
    // En cas d'erreur dans le masquage, retourner un message générique
    return "Erreur inconnue (détails masqués pour sécurité)";
  }
  
  return sanitizedMessage;
}

/**
 * Wrapper pour console.error qui masque les informations sensibles
 * @param message Le message d'erreur
 * @param args Arguments supplémentaires
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  // Masquer le message principal
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  // Masquer également les arguments qui pourraient contenir des informations sensibles
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Tenter de masquer les objets JSON contenant des informations sensibles
        const jsonString = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonString);
        return JSON.parse(sanitizedJson);
      } catch {
        // En cas d'échec, retourner un objet générique
        return {"message": "Objet masqué pour raisons de sécurité"};
      }
    }
    return arg;
  });
  
  // Utiliser console.error directement ici pour éviter les boucles infinies
  // La version globale de console.error est déjà écrasée
  console.error(sanitizedMessage, ...sanitizedArgs);
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
