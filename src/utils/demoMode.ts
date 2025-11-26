/**
 * Utilitaire pour détecter et gérer le mode démo (pour les testeurs)
 */

/**
 * Vérifie si l'utilisateur est en mode démo (testeur)
 */
export const isDemoMode = (userRole?: string | null): boolean => {
  if (!userRole) return false;
  return userRole === 'testeur';
};

/**
 * Catégories mockées pour le mode démo
 */
export const DEMO_CATEGORIES = [
  {
    id: 1,
    name: "Catégorie Test 1",
    slug: "categorie-test-1",
    count: 0
  },
  {
    id: 2,
    name: "Catégorie Test 2",
    slug: "categorie-test-2",
    count: 0
  },
  {
    id: 3,
    name: "Catégorie Test 3",
    slug: "categorie-test-3",
    count: 0
  }
];

/**
 * Génère une URL WordPress fictive pour le mode démo
 */
export const generateDemoWordPressUrl = (announcementId: string): string => {
  return `https://demo-wordpress.digiibuz.fr/annonce/${announcementId}`;
};

/**
 * Génère une URL Facebook fictive pour le mode démo
 */
export const generateDemoFacebookUrl = (): string => {
  return `https://www.facebook.com/demo-post-${Date.now()}`;
};

/**
 * Génère une URL Instagram fictive pour le mode démo
 */
export const generateDemoInstagramUrl = (): string => {
  return `https://www.instagram.com/p/demo-${Date.now()}`;
};
