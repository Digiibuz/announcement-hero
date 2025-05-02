
/**
 * Utilitaire pour gérer les clés sensibles de manière sécurisée
 */

// Fonction simple d'obscurcissement des clés (pas un cryptage fort, mais suffisant pour obfusquer)
export function obfuscateKey(key: string): string {
  // Transformation simple pour masquer la clé sans la rendre totalement irrécupérable
  return Array.from(key)
    .map(char => char.charCodeAt(0).toString(16))
    .join('');
}

// Fonction pour désobfusquer une clé
export function deobfuscateKey(obfuscated: string): string {
  // Transformation inverse
  let result = '';
  for (let i = 0; i < obfuscated.length; i += 2) {
    if (i + 1 < obfuscated.length) {
      const hexPair = obfuscated.substring(i, i + 2);
      result += String.fromCharCode(parseInt(hexPair, 16));
    }
  }
  return result;
}

// Fonction pour masquer partiellement une clé dans les logs ou l'UI
export function maskKey(key: string): string {
  if (!key) return '';
  
  // Affiche seulement les 4 premiers et 4 derniers caractères
  const firstPart = key.substring(0, 4);
  const lastPart = key.substring(key.length - 4);
  return `${firstPart}...${lastPart}`;
}

// Sauvegarde sécurisée en utilisant sessionStorage (préférable au localStorage pour les données sensibles)
export function secureStore(key: string, value: string): void {
  try {
    const obfuscated = obfuscateKey(value);
    sessionStorage.setItem(`secure_${key}`, obfuscated);
  } catch (error) {
    console.error('Erreur lors du stockage sécurisé', { key });
  }
}

// Récupération sécurisée
export function secureRetrieve(key: string): string | null {
  try {
    const obfuscated = sessionStorage.getItem(`secure_${key}`);
    if (!obfuscated) return null;
    return deobfuscateKey(obfuscated);
  } catch (error) {
    console.error('Erreur lors de la récupération sécurisée', { key });
    return null;
  }
}

// Fonction pour nettoyer les erreurs dans la console
export function sanitizeErrorForConsole(error: any): any {
  if (!error) return error;
  
  // Clone l'erreur pour ne pas modifier l'original
  const sanitized = { ...error };
  
  // Liste des propriétés sensibles à masquer
  const sensitivePropPatterns = [
    /key/i, 
    /token/i, 
    /password/i, 
    /secret/i, 
    /auth/i,
    /url/i,
    /endpoint/i
  ];
  
  // Parcourt récursivement l'objet
  function sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    Object.keys(obj).forEach(prop => {
      // Si c'est une propriété sensible
      if (sensitivePropPatterns.some(pattern => pattern.test(prop))) {
        if (typeof obj[prop] === 'string') {
          obj[prop] = maskKey(obj[prop]);
        }
      }
      
      // Récursion pour les objets imbriqués
      if (obj[prop] && typeof obj[prop] === 'object') {
        sanitizeObject(obj[prop]);
      }
    });
    
    return obj;
  }
  
  return sanitizeObject(sanitized);
}

// Remplace la console.error native pour nettoyer les erreurs automatiquement
const originalConsoleError = console.error;
console.error = function(...args) {
  // Sanitize les arguments qui pourraient contenir des informations sensibles
  const sanitizedArgs = args.map(arg => {
    if (arg && typeof arg === 'object') {
      return sanitizeErrorForConsole(arg);
    }
    if (typeof arg === 'string') {
      // Masque les URLs, tokens, clés, etc. dans les chaînes de caractères
      return arg.replace(/(https?:\/\/[^/]+\/[^\s"']*token=)([^&\s"']+)/gi, '$1[MASKED]')
                .replace(/(key=|apikey=|token=|secret=)([^&\s"']+)/gi, '$1[MASKED]')
                .replace(/(Bearer\s+)([^\s"']+)/gi, '$1[MASKED]');
    }
    return arg;
  });
  
  originalConsoleError.apply(console, sanitizedArgs);
};

export const SecureKeysConfig = {
  KEY_NAMES: {
    SUPABASE_URL: 'SUPABASE_URL',
    SUPABASE_KEY: 'SUPABASE_KEY'
  }
};
