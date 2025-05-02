
/**
 * Utilitaire simple pour crypter/décrypter des chaînes de caractères
 * Note: Ce n'est pas un cryptage fort, mais suffisant pour obfusquer les valeurs
 */

// Clé de cryptage simple - vous pouvez la changer pour plus de sécurité
const CRYPTO_KEY = "D1G11BUZ_S3CUR1TY_K3Y";

/**
 * Crypte une chaîne avec un simple XOR
 */
export function encrypt(str: string): string {
  if (!str) return str;
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // Encode en base64 pour assurer la compatibilité
}

/**
 * Décrypte une chaîne cryptée
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return encrypted;
  try {
    const str = atob(encrypted); // Décode de base64
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i) ^ CRYPTO_KEY.charCodeAt(i % CRYPTO_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error('Erreur de décryptage:', e);
    return encrypted; // Retourne la valeur d'origine en cas d'erreur
  }
}

/**
 * Vérifie si une chaîne est cryptée (commence par une forme base64 valide)
 */
export function isEncrypted(str: string): boolean {
  try {
    if (!str) return false;
    // Vérifie si la chaîne ressemble à du base64 valide
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(str) && str.length % 4 === 0;
  } catch (e) {
    return false;
  }
}
