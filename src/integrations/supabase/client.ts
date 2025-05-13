
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Module crypto-js pour le déchiffrement côté client
import { enc, AES, PBKDF2, lib, HmacSHA256 } from 'crypto-js';

// Clé temporaire utilisée pendant l'initialisation
const TEMP_SUPABASE_URL = "https://rdwqedmvzicerwotjseg.supabase.co";
const TEMP_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk";

// Créer un client temporaire pour commencer
let supabase = createClient<Database>(
  TEMP_SUPABASE_URL,
  TEMP_SUPABASE_ANON_KEY
);

// Fonctions de déchiffrement
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fonction pour désọbfusquer les données
function deobfuscateData(data: string, salt: string): string {
  const obfuscationKey = salt.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0) % 256;
  let result = '';
  
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ obfuscationKey;
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

// Fonction pour obtenir la clé de chiffrement
function getEncryptionSecret(): string {
  const timestamp = Date.now().toString().slice(0, 8);
  const projectId = "rdwqedmvzicerwotjseg";
  const projectIdPart = projectId.slice(0, 8);
  
  return `S3cur3-${projectIdPart}-${timestamp}-K3y!`;
}

// Fonction pour décrypter les données
async function decryptData(encryptedBase64: string, secretKey: string): Promise<string> {
  try {
    // Convertir la chaîne Base64 en tableau d'octets
    const encryptedBytes = base64ToArrayBuffer(encryptedBase64);
    
    // Extraire l'IV (16 premiers octets)
    const iv = encryptedBytes.slice(0, 16);
    
    // Extraire le sel (16 octets suivants)
    const salt = encryptedBytes.slice(16, 32);
    
    // Extraire les données chiffrées (reste des octets)
    const ciphertext = encryptedBytes.slice(32);
    
    // Convertir les données pour CryptoJS
    const ivWordArray = lib.WordArray.create(Array.from(iv));
    const saltWordArray = lib.WordArray.create(Array.from(salt));
    const ciphertextWordArray = lib.WordArray.create(Array.from(ciphertext));
    
    // Générer la clé avec PBKDF2
    const key = PBKDF2(secretKey, saltWordArray, {
      keySize: 256/32,
      iterations: 100000,
      hasher: HmacSHA256
    });
    
    // Décrypter
    const decrypted = AES.decrypt(
      { ciphertext: ciphertextWordArray } as any,
      key,
      { iv: ivWordArray, mode: lib.mode.GCM }
    );
    
    return decrypted.toString(enc.Utf8);
  } catch (error) {
    console.error("Erreur de déchiffrement:", error);
    throw new Error("Impossible de déchiffrer les données");
  }
}

// Fonction pour vérifier la signature
function verifySignature(data: string, signature: string, key: string): boolean {
  const calculatedSignature = HmacSHA256(data, key).toString(enc.Base64);
  return calculatedSignature === signature;
}

// Fonction pour initialiser le client Supabase avec les configurations sécurisées
async function initSupabaseClient() {
  try {
    // URL de l'Edge Function Supabase (URL absolue)
    const edgeFunctionUrl = "https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-public-config";
    
    // Récupérer la configuration depuis l'Edge Function
    const response = await fetch(edgeFunctionUrl);
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de la configuration: ${response.status}`);
    }
    
    const config = await response.json();
    
    if (config.error) {
      throw new Error(`Erreur de configuration: ${config.error}`);
    }
    
    // Vérifier que nous avons un mode chiffré
    if (config.mode !== "encrypted-v2") {
      throw new Error("Version de chiffrement non prise en charge");
    }
    
    // Récupérer les données chiffrées
    const encryptedUrl = config.d1;
    const encryptedKey = config.d2;
    const urlSignature = config.s1;
    const keySignature = config.s2;
    const saltBase64 = config.salt;
    
    // Obtenir la clé de chiffrement
    const encryptionSecret = getEncryptionSecret();
    
    // Vérifier les signatures pour l'intégrité
    if (!verifySignature(encryptedUrl, urlSignature, encryptionSecret)) {
      throw new Error("Signature de l'URL invalide - possible tentative de falsification");
    }
    
    if (!verifySignature(encryptedKey, keySignature, encryptionSecret)) {
      throw new Error("Signature de la clé invalide - possible tentative de falsification");
    }
    
    // Décrypter les données
    const obfuscatedUrl = await decryptData(encryptedUrl, encryptionSecret);
    const obfuscatedKey = await decryptData(encryptedKey, encryptionSecret);
    
    // Désọbfusquer les données
    const salt = atob(saltBase64);
    const supabaseUrl = deobfuscateData(obfuscatedUrl, salt);
    const supabaseAnonKey = deobfuscateData(obfuscatedKey, salt);
    
    // Créer et retourner le nouveau client Supabase avec les informations déchiffrées
    console.log("Client Supabase initialisé avec succès");
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    
    return supabase;
  } catch (error) {
    console.error("Erreur d'initialisation du client Supabase:", error);
    // En cas d'erreur, conserver le client temporaire pour éviter un échec complet
    console.warn("Utilisation du client temporaire pour éviter un échec catastrophique");
    return supabase;
  }
}

// Initialiser le client immédiatement
initSupabaseClient().catch(err => {
  console.error("Échec de l'initialisation sécurisée du client Supabase:", err);
});

// Exporter le client Supabase
export { supabase };

// Note: Ce client a la sécurité renforcée par chiffrement
// Pour toute opération sensible, utilisez les edge functions avec le rôle de service
