
// Utilitaires pour la gestion des suffixes de mots de passe aléatoires

/**
 * Génère un suffixe aléatoire de 10 caractères
 * @returns {string} Un suffixe aléatoire
 */
export const generateRandomSuffix = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let suffix = '';
  for (let i = 0; i < 10; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return suffix;
};

/**
 * Récupère le suffixe correspondant à un utilisateur spécifique
 * @param {string} email - L'email de l'utilisateur
 * @returns {string|null} Le suffixe stocké ou null si non trouvé
 */
export const getSuffixForUser = (email: string): string | null => {
  const suffixesStr = localStorage.getItem('passwordSuffixes');
  if (!suffixesStr) return null;
  
  try {
    const suffixes = JSON.parse(suffixesStr);
    return suffixes[email] || null;
  } catch (error) {
    console.error("Erreur lors de la récupération du suffixe:", error);
    return null;
  }
};

/**
 * Enregistre un suffixe pour un utilisateur spécifique
 * @param {string} email - L'email de l'utilisateur
 * @param {string} suffix - Le suffixe à enregistrer
 */
export const saveSuffixForUser = (email: string, suffix: string): void => {
  const suffixesStr = localStorage.getItem('passwordSuffixes');
  let suffixes = {};
  
  if (suffixesStr) {
    try {
      suffixes = JSON.parse(suffixesStr);
    } catch (error) {
      console.error("Erreur lors du parsing des suffixes:", error);
    }
  }
  
  suffixes = { ...suffixes, [email]: suffix };
  localStorage.setItem('passwordSuffixes', JSON.stringify(suffixes));
  console.log(`Suffixe enregistré pour ${email}`);
};

/**
 * Récupère et enregistre le suffixe temporaire pour un utilisateur qui vient d'être créé
 * @param {string} email - L'email de l'utilisateur nouvellement créé
 */
export const saveTempSuffixForNewUser = (email: string): void => {
  const tempSuffix = sessionStorage.getItem('tempPasswordSuffix');
  if (tempSuffix) {
    saveSuffixForUser(email, tempSuffix);
    sessionStorage.removeItem('tempPasswordSuffix');
  }
};
