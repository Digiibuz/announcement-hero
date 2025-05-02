
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
 * Ajouter une méthode au prototype de Date pour vérifier si une date est valide
 * Cette méthode est sécurisée car elle ne modifie que notre propre propriété
 */
if (!Date.prototype.hasOwnProperty('isValid')) {
  Object.defineProperty(Date.prototype, 'isValid', {
    value: function() {
      return !isNaN(this.getTime());
    },
    enumerable: false,
    configurable: true
  });
}
