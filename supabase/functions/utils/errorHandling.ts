
/**
 * Utilitaires pour la gestion des erreurs dans les fonctions Edge
 */

// En-têtes CORS standard pour les fonctions Edge
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour nettoyer les erreurs avant de les envoyer au client
export function sanitizeError(error: any): { message: string, details?: string } {
  // Si c'est une instance d'Error
  if (error instanceof Error) {
    return {
      message: maskedErrorMessage(error.message),
      details: error.stack ? maskedErrorMessage(error.stack) : undefined
    };
  }
  
  // Si c'est un objet d'erreur
  if (error && typeof error === 'object') {
    return {
      message: error.message ? maskedErrorMessage(error.message) : 'Une erreur est survenue',
      details: error.details ? maskedErrorMessage(error.details) : undefined
    };
  }
  
  // Fallback
  return {
    message: typeof error === 'string' ? maskedErrorMessage(error) : 'Une erreur est survenue'
  };
}

// Fonction pour masquer les informations sensibles dans les messages d'erreur
function maskedErrorMessage(message: string): string {
  if (!message) return 'Une erreur est survenue';
  
  // Masque les URLs avec des paramètres sensibles
  return message
    // Masque les URLs et tokens
    .replace(/(https?:\/\/[^/]+\/[^\s"']*token=)([^&\s"']+)/gi, '$1[MASQUÉ]')
    .replace(/(https?:\/\/[^/]+\/[^\s"']*key=)([^&\s"']+)/gi, '$1[MASQUÉ]')
    // Masque les clés API, tokens, etc.
    .replace(/(key=|apikey=|token=|secret=)([^&\s"']+)/gi, '$1[MASQUÉ]')
    .replace(/(Bearer\s+)([^\s"']+)/gi, '$1[MASQUÉ]')
    // Masque les URLs de Supabase
    .replace(/(https?:\/\/[^/]+\.supabase\.co)/gi, '[URL SUPABASE MASQUÉE]')
    // Masque les IDs longs qui pourraient être des tokens
    .replace(/([0-9a-f]{30,})/gi, '[ID MASQUÉ]');
}

// Fonction pour générer une réponse d'erreur standardisée
export function errorResponse(error: any, status: number = 500): Response {
  const sanitizedError = sanitizeError(error);
  
  console.error('Erreur dans la fonction Edge:', sanitizedError);
  
  return new Response(
    JSON.stringify({ 
      error: sanitizedError.message,
      details: sanitizedError.details
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    }
  );
}

// Fonction pour gérer les requêtes CORS OPTIONS
export function handleCorsOptions(): Response {
  return new Response(null, {
    headers: corsHeaders,
    status: 204 // No Content est approprié pour OPTIONS
  });
}
