
/**
 * Utilitaires pour manipuler les dates de manière sécurisée
 */

/**
 * Vérifie si une valeur est une date valide
 * @param value Valeur à vérifier
 * @returns true si la valeur est une date valide, sinon false
 */
export function isValidDate(value: any): boolean {
  if (!value) return false;
  
  try {
    const date = new Date(value);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
}

/**
 * Crée une date sécurisée à partir d'une valeur
 * @param value Valeur à convertir en date
 * @param fallback Date à utiliser en cas d'échec (par défaut: date actuelle)
 * @returns Date valide
 */
export function safeDate(value: any, fallback?: Date): Date {
  if (!value) return fallback || new Date();
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? (fallback || new Date()) : date;
  } catch (error) {
    return fallback || new Date();
  }
}

/**
 * Formate une date en ISO string de manière sécurisée
 * @param value Valeur à formater
 * @returns ISO string ou chaîne vide en cas d'échec
 */
export function safeISOString(value: any): string {
  try {
    const date = safeDate(value);
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

/**
 * Corrige une chaîne de date JSON qui pourrait être mal formatée
 * @param jsonString Chaîne JSON à corriger
 * @returns Chaîne JSON corrigée
 */
export function fixDateInJSON(jsonString: string): string {
  try {
    // Remplacer les dates invalides par des dates valides
    return jsonString.replace(
      /"timestamp":\s*"([^"]+)"/g,
      (match, dateStr) => {
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) 
            ? `"timestamp":"${new Date().toISOString()}"` 
            : match;
        } catch (error) {
          return `"timestamp":"${new Date().toISOString()}"`;
        }
      }
    );
  } catch (error) {
    return jsonString;
  }
}

/**
 * Normalisateur de timestamp qui traite diverses formes de timestamps
 * @param timestamp Timestamp à normaliser (string, number, Date)
 * @returns Timestamp normalisé sous forme de Date valide
 */
export function normalizeTimestamp(timestamp: string | number | Date | undefined): Date {
  if (!timestamp) return new Date();
  
  try {
    // Si c'est déjà une date
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? new Date() : timestamp;
    }
    
    // Si c'est un nombre (timestamp Unix)
    if (typeof timestamp === 'number') {
      // Vérifier si c'est en millisecondes ou en secondes
      const date = timestamp > 9999999999 
        ? new Date(timestamp) 
        : new Date(timestamp * 1000);
      
      return isNaN(date.getTime()) ? new Date() : date;
    }
    
    // Si c'est une chaîne
    if (typeof timestamp === 'string') {
      // Essayer d'analyser comme ISO String
      const date = new Date(timestamp);
      
      // Si valide, utiliser cette date
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Essayer d'analyser comme un nombre
      const numTimestamp = parseFloat(timestamp);
      if (!isNaN(numTimestamp)) {
        return normalizeTimestamp(numTimestamp);
      }
    }
    
    // Cas d'échec
    return new Date();
    
  } catch (error) {
    return new Date();
  }
}

// Ajouter des méthodes utiles au prototype de Date
if (!Date.prototype.hasOwnProperty('isValid')) {
  Object.defineProperty(Date.prototype, 'isValid', {
    value: function() {
      return !isNaN(this.getTime());
    },
    enumerable: false,
    configurable: true
  });
}
