
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
  'credentials'
];

// Liste des protocoles à détecter
export const PROTOCOLS = ['http://', 'https://'];

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
  // URLs contenant le mot login
  /https?:\/\/[^/]+\/login[^/\s"]*/gi,
  // Masquer les URLs Lovable
  /https?:\/\/[a-z0-9-]+\.lovable\.app[^\s]*/gi,
  /https?:\/\/[a-z0-9-]+\.lovableproject\.com[^\s]*/gi,
  // Masquer les preview URLs
  /https?:\/\/preview-[a-z0-9-]+\.[^\s\/"]*/gi,
  // Format des jetons JWT
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Masquer les codes d'erreur qui pourraient contenir des informations sensibles
  /(supabase|auth).*error.*code[^\s"]*/gi,
  // Masquer toute requête HTTP (méthode + URL)
  /(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+https?:\/\/[^\s]+/gi,
];
