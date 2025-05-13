
import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'

// En-têtes CORS pour permettre l'accès depuis le frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupération des variables d'environnement depuis Deno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Variables d'environnement manquantes");
    }
    
    // Génération d'un identifiant unique pour cette session
    const sessionId = crypto.randomUUID();
    
    // Génération d'une empreinte temporaire cryptographiquement sécurisée
    const timestamp = Date.now().toString();
    const fingerprint = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`${supabaseUrl}:${timestamp}:${sessionId}`)
    );
    
    // Convertir l'empreinte en chaîne hexadécimale
    const fingerprintHex = Array.from(new Uint8Array(fingerprint))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Créer un objet de configuration sécurisé avec des tokens d'accès temporaires
    // Au lieu de stocker les clés API directement dans l'objet de réponse
    const responseData = {
      projectId: "rdwqedmvzicerwotjseg", // Cet ID est public et peut être partagé
      timestamp: timestamp,
      sessionId: sessionId,
      fingerprint: fingerprintHex.slice(0, 32), // Utiliser seulement une partie de l'empreinte
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
