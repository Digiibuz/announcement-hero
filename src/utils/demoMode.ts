/**
 * Utilitaire pour détecter et gérer le mode démo (pour les tests Apple)
 */

// Email de test utilisé par Apple
export const DEMO_TEST_EMAIL = "apple-test@digiibuz.fr";

/**
 * Vérifie si l'utilisateur est en mode démo
 */
export const isDemoMode = (userEmail?: string | null): boolean => {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === DEMO_TEST_EMAIL.toLowerCase();
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
  return `https://demo.digiibuz.fr/annonce/${announcementId}`;
};
