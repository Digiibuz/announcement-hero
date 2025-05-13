
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import * as crypto from "https://deno.land/std@0.170.0/crypto/mod.ts";

// En-têtes CORS pour permettre l'accès depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Fonction pour obtenir un IV aléatoire
function getRandomIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Fonction pour convertir une chaîne en ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str);
}

// Fonction pour convertir un ArrayBuffer en chaîne Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Fonction pour générer une clé de chiffrement à partir d'une clé maître
async function generateKey(masterKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    stringToArrayBuffer(masterKey),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// Fonction pour chiffrer des données
async function encryptData(data: string, secretKey: string): Promise<string> {
  const iv = getRandomIV();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await generateKey(secretKey, salt);
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    stringToArrayBuffer(data)
  );
  
  // Regrouper IV + sel + données chiffrées
  const result = new Uint8Array(iv.length + salt.length + new Uint8Array(encryptedData).length);
  result.set(iv, 0);
  result.set(salt, iv.length);
  result.set(new Uint8Array(encryptedData), iv.length + salt.length);
  
  return arrayBufferToBase64(result.buffer);
}

// Fonction pour générer une signature HMAC
async function generateSignature(data: string, key: string): Promise<string> {
  const keyData = await crypto.subtle.importKey(
    "raw",
    stringToArrayBuffer(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    keyData,
    stringToArrayBuffer(data)
  );
  
  return arrayBufferToBase64(signature);
}

// Fonction pour obfusquer les données
function obfuscateData(data: string, salt: string): string {
  const obfuscationKey = salt.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
  let result = '';
  
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ obfuscationKey;
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

// Le secret pour le chiffrement (on utilise un mélange de valeurs pour créer une clé forte)
function getEncryptionSecret(): string {
  const timestamp = Date.now().toString().slice(0, 8); // Utilise une partie du timestamp
  const projectId = Deno.env.get("SUPABASE_PROJECT_ID") || "unknown";
  const projectIdPart = projectId.slice(0, 8); // Prend une partie du project ID
  
  // Combiner les valeurs avec des caractères fixes pour créer une clé forte
  return `S3cur3-${projectIdPart}-${timestamp}-K3y!`;
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupération des variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const projectId = Deno.env.get("SUPABASE_PROJECT_ID") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variables d'environnement manquantes");
    }
    
    // Sel unique pour l'obfuscation
    const obfuscationSalt = `${projectId}-${new Date().getUTCDate()}`;
    
    // Obfuscation des données
    const obfuscatedUrl = obfuscateData(supabaseUrl, obfuscationSalt);
    const obfuscatedKey = obfuscateData(supabaseAnonKey, obfuscationSalt);
    
    // Chiffrement des données obfusquées
    const encryptionSecret = getEncryptionSecret();
    const encryptedUrl = await encryptData(obfuscatedUrl, encryptionSecret);
    const encryptedKey = await encryptData(obfuscatedKey, encryptionSecret);
    
    // Génération de signatures pour l'intégrité
    const urlSignature = await generateSignature(encryptedUrl, encryptionSecret);
    const keySignature = await generateSignature(encryptedKey, encryptionSecret);
    
    // Ajout d'informations aléatoires pour compliquer la rétro-ingénierie
    const noise = crypto.randomUUID();
    const timestamp = Date.now();
    
    // Construction de la réponse avec les données chiffrées
    const responseData = {
      d1: encryptedUrl,
      d2: encryptedKey,
      s1: urlSignature,
      s2: keySignature,
      salt: arrayBufferToBase64(stringToArrayBuffer(obfuscationSalt)),
      noise: noise,
      t: timestamp,
      mode: "encrypted-v2" // Indication de la version de chiffrement
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Erreur lors de la génération de la configuration:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
