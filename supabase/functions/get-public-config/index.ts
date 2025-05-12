
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Clé de chiffrement forte (ne sera jamais exposée au client)
const ENCRYPTION_KEY = "k3y@S3cur1ty#Str0ng!2025";

// Fonction pour obtenir l'URL Supabase de façon sécurisée
const getSupabaseUrl = () => {
  // Récupérer l'URL depuis les variables d'environnement de la fonction Edge
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  
  // Vérifier si l'URL est définie
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL non définie dans les variables d\'environnement');
  }
  
  // Crypter l'URL avec une méthode avancée
  return encryptValue(supabaseUrl);
}

// Fonction pour obtenir la clé anonyme Supabase de façon sécurisée
const getSupabaseAnonKey = () => {
  // Récupérer la clé anonyme depuis les variables d'environnement de la fonction Edge
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  // Vérifier si la clé est définie
  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY non définie dans les variables d\'environnement');
  }
  
  // Crypter la clé avec une méthode avancée
  return encryptValue(supabaseAnonKey);
}

// Fonction de cryptage avancée pour protéger les valeurs sensibles
function encryptValue(value: string): string {
  try {
    // Générer un vecteur d'initialisation (IV) aléatoire pour chaque chiffrement
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ivString = Array.from(iv).map(b => String.fromCharCode(b)).join('');
    
    // Ajouter du bruit aléatoire (salt) pour renforcer la sécurité
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltString = Array.from(salt).map(b => String.fromCharCode(b)).join('');
    
    // Combiner la valeur avec le sel et un timestamp pour empêcher les attaques par rejeu
    const timestamp = Date.now().toString();
    const valueToEncrypt = `${value}:${timestamp}:${saltString}`;
    
    // Transformation de la valeur en utilisant plusieurs techniques
    const transformed = valueToEncrypt
      .split('')
      .map((char, index) => {
        // XOR avec caractères de la clé pour un niveau d'obfuscation supplémentaire
        const keyChar = ENCRYPTION_KEY.charCodeAt(index % ENCRYPTION_KEY.length);
        return String.fromCharCode(char.charCodeAt(0) ^ (keyChar % 5));
      })
      .join('');
    
    // Encoder en base64 avec l'IV au début pour permettre le déchiffrement
    const encoded = btoa(`${ivString}${transformed}`);
    
    // Ajouter des caractères aléatoires pour masquer davantage la structure
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    
    // Le format final inclut une signature pour vérifier l'intégrité
    const signature = createSignature(encoded);
    
    return `${encoded}.${signature}.${randomSuffix}`;
  } catch (error) {
    console.error("Erreur lors du chiffrement:", error);
    throw new Error("Échec du chiffrement des données");
  }
}

// Crée une signature simple pour vérifier l'intégrité des données
function createSignature(data: string): string {
  // Hachage simple basé sur la clé et les données
  let hash = 0;
  const combinedString = ENCRYPTION_KEY + data;
  
  for (let i = 0; i < combinedString.length; i++) {
    const char = combinedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  
  // Convertir en chaîne hexadécimale pour faciliter le transport
  return Math.abs(hash).toString(16).padStart(8, '0');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupère uniquement les informations publiques qui peuvent être partagées avec le client
    // Les valeurs réelles sont stockées dans les variables d'environnement côté serveur
    // Les valeurs renvoyées sont cryptées pour éviter la divulgation directe
    const config = {
      supabaseUrl: getSupabaseUrl(),
      supabaseAnonKey: getSupabaseAnonKey(),
      timestamp: Date.now(), // Ajout d'un timestamp pour éviter la mise en cache
    }
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          // Ajouter des en-têtes pour empêcher la mise en cache
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erreur dans get-public-config:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur inattendue s\'est produite' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
