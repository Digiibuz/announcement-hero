
/**
 * Constants and utilities for identifying sensitive patterns
 */

// Éviter de stocker directement les domaines sensibles sous forme de chaînes brutes
// Utiliser une fonction qui génère dynamiquement les valeurs sensibles
export function getSensitiveDomains(): string[] {
  // Obfusquer les domaines pour rendre plus difficile l'extraction statique
  const domains = [
    atob('c3VwYWJhc2UuY28='), // supabase.co encodé en base64
    'lovable.app',
    'lovableproject.com',
    'digiibuz.fr',
    'digii.app',
    'digi.app',
    'beta.digii.app',
    // Ne pas stocker directement l'ID du projet, il sera détecté par regex pattern
  ];
  return domains;
}

// Liste des mots-clés sensibles à détecter
export const SENSITIVE_KEYWORDS = [
  'token',
  'password',
  'auth',
  'key',
  'secret',
  'supabase',
  'preview',
  'login',
  'grant',
  'credentials',
  'v1',
  'authentification',
  'auth/v1',
  'token?grant',
  'type=password'
];

// Liste des protocoles à détecter
export const PROTOCOLS = ['http://', 'https://', 'ws://', 'wss://'];

// Liste des méthodes HTTP à masquer
export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

// Patterns regex pour identifier les formats sensibles
export const SENSITIVE_PATTERNS = [
  // Format d'ID de projet Supabase (séquence de lettres et chiffres de longueur typique)
  /[a-z0-9]{20,22}\.supabase\.co/gi,
  // Format plus précis avec HTTP(S)
  /https?:\/\/[a-z0-9]{10,50}\.supabase\.co[^\s]*/gi,
  // URLs avec auth ou token dans le chemin
  /https?:\/\/[^/]+\/auth\/[^/\s"]*/gi,
  /https?:\/\/[^/]+\/token[^/\s"]*/gi,
  /https?:\/\/[^/]+\/v1\/token[^/\s"]*/gi,
  // URLs contenant le mot login
  /https?:\/\/[^/]+\/login[^/\s"]*/gi,
  // Masquer les URLs Lovable
  /https?:\/\/[a-z0-9-]+\.lovable\.app[^\s]*/gi,
  /https?:\/\/[a-z0-9-]+\.lovableproject\.com[^\s]*/gi,
  // Masquer les URLs DigiBuz
  /https?:\/\/[a-z0-9.-]+\.digiibuz\.fr[^\s]*/gi,
  /https?:\/\/[a-z0-9.-]+\.digii\.app[^\s]*/gi,
  /https?:\/\/beta\.digii\.app[^\s]*/gi,
  // Masquer les preview URLs
  /https?:\/\/preview-[a-z0-9-]+\.[^\s\/"]*/gi,
  // Format des jetons JWT
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Masquer les codes d'erreur qui pourraient contenir des informations sensibles
  /(supabase|auth).*error.*code[^\s"]*/gi,
  // Masquer toute requête HTTP (méthode + URL)
  /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+https?:\/\/[^\s]+/gi,
  // Masquer les requêtes spécifiques à auth
  /POST\s+https?:\/\/[^\s]*\/auth\/v1\/token[^\s]*/gi,
  // Masquer les URLs avec token?grant
  /https?:\/\/[^\s]*token\?grant[^\s]*/gi,
  // Masquer spécifiquement les requêtes POST sensibles
  /POST\s+https?:\/\/[^\s]*/gi,
];

// Fonction pour sécuriser l'affichage de toute erreur d'authentification 
export function getSecureAuthErrorMessage(errorCode: string): string {
  // Masquer les détails spécifiques des erreurs d'authentification
  switch (errorCode) {
    case 'invalid_credentials':
      return '[ERREUR_AUTHENTIFICATION]';
    case 'invalid_grant':
      return '[ERREUR_AUTHENTIFICATION]';
    case 'access_denied':
      return '[ACCÈS_REFUSÉ]';
    default:
      return '[ERREUR_SÉCURISÉE]';
  }
}
