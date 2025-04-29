
/**
 * Constants and utilities for identifying sensitive patterns
 */

// Éviter de stocker directement les domaines sensibles sous forme de chaînes brutes
// Utiliser une fonction qui génère dynamiquement les valeurs sensibles
export function getSensitiveDomains(): string[] {
  // Liste complète des domaines à masquer
  const domains = [
    // Domaines Supabase (encodés en base64 pour plus de sécurité)
    atob('c3VwYWJhc2UuY28='), // supabase.co encodé en base64
    atob('c3VwYWJhc2UuaW4='), // supabase.in encodé en base64
    
    // Domaines de l'application (internes et de production)
    'lovable.app',
    'lovableproject.com',
    'digiibuz.fr',
    'digii.app',
    'digi.app',
    'beta.digii.app',
    'beta.digi.app',
    'api.digii.app',
    'api.digiibuz.fr',
    'app.digii.app',
    'app.digiibuz.fr',
    
    // URL de déploiement et de développement
    'localhost',
    'localhost:3000',
    'localhost:5173',
    'rdwqedmvzicerwotjseg.supabase.co'
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
  'type=password',
  'get-config',
  'functions/v1',
  '401',
  'authorization',
  'header',
  'missing'
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
  // Masquer les URLs Edge Functions
  /https?:\/\/[^/]+\/functions\/v1\/[^/\s"]*/gi,
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
  // Messages d'erreur 401
  /401.*missing authorization header/gi,
  /missing authorization header/gi,
  // Masquer toute requête HTTP (méthode + URL)
  /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+https?:\/\/[^\s]+/gi,
  // Masquer les requêtes spécifiques à auth
  /POST\s+https?:\/\/[^\s]*\/auth\/v1\/token[^\s]*/gi,
  // Masquer les URLs avec token?grant
  /https?:\/\/[^\s]*token\?grant[^\s]*/gi,
  // Masquer spécifiquement les requêtes POST sensibles
  /POST\s+https?:\/\/[^\s]*/gi,
  // Masquer l'URL complète du projet avec l'ID
  /https?:\/\/rdwqedmvzicerwotjseg\.supabase\.co[^\s]*/gi,
  // Masquer les Edge Functions URLs
  /https?:\/\/rdwqedmvzicerwotjseg\.supabase\.co\/functions\/v1\/[^\s]*/gi,
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
    case 'missing authorization header':
      return '[ERREUR_AUTORISATION]';
    case '401':
    case 401:
      return '[ERREUR_AUTHENTIFICATION_401]';
    default:
      return '[ERREUR_SÉCURISÉE]';
  }
}
