
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, description } = await req.json();
    
    let prompt = "";
    let systemMessage = "";
    
    // Configure the prompt based on the type of optimization
    switch (type) {
      case "description":
        systemMessage = "Tu es un rédacteur professionnel. Améliore ce contenu pour le rendre clair, concis et professionnel. Maintiens le style formel mais accessible, et assure-toi que toutes les informations importantes sont préservées. IMPORTANT: Fournis UNIQUEMENT le texte réécrit, sans préface ni commentaire.";
        prompt = `Voici un contenu à améliorer: "${description}". Réécris ce texte en le rendant plus professionnel, bien structuré et attrayant pour les lecteurs. Ne commence pas ta réponse par une phrase d'introduction comme "Voici une version améliorée" et n'ajoute pas de commentaires à la fin.`;
        break;
      case "seoTitle":
        systemMessage = "Tu es un expert en SEO. Crée un titre optimisé pour les moteurs de recherche basé sur le contenu fourni. Le titre doit être accrocheur, pertinent et contenir des mots-clés importants. Maximum 60 caractères. IMPORTANT: Fournis UNIQUEMENT le titre, sans préface ni commentaire.";
        prompt = `Voici le titre actuel: "${title}" et la description: "${description}". Génère un titre SEO optimisé d'environ 50-60 caractères basé sur ce contenu. Renvoie uniquement le titre sans aucune phrase d'introduction ou commentaire.`;
        break;
      case "seoDescription":
        systemMessage = "Tu es un expert en SEO. Crée une méta-description optimisée pour les moteurs de recherche basée sur le contenu fourni. La description doit être informative, inciter à l'action, et contenir des mots-clés importants. Maximum 155 caractères. IMPORTANT: Fournis UNIQUEMENT la méta-description, sans préface ni commentaire.";
        prompt = `Voici le titre: "${title}" et la description: "${description}". Génère une méta-description SEO d'environ 120-155 caractères qui résume le contenu de manière attrayante. Renvoie uniquement la méta-description sans aucune phrase d'introduction ou commentaire.`;
        break;
      default:
        throw new Error("Type d'optimisation non supporté");
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Erreur lors de la génération du contenu');
    }
    
    let optimizedContent = data.choices[0].message.content;
    
    // Post-traitement pour retirer tout texte introductif ou commentaire
    optimizedContent = optimizedContent
      // Supprime les phrases d'introduction comme "Voici" ou "Bien sûr"
      .replace(/^(Bien sûr !|Voici|Certainement|D'accord|Absolument|Voilà|Avec plaisir)[^\n]*\n+/i, '')
      // Supprime les commentaires finaux commençant par des tirets ou des remarques
      .replace(/\n+(-{2,}|Remarque|Note|Cette version)[^\n]*$/i, '')
      // Supprime les guillemets qui pourraient entourer la réponse
      .replace(/^["\s]+|["\s]+$/g, '')
      .trim();

    console.log("Contenu optimisé traité: ", optimizedContent);

    return new Response(JSON.stringify({ 
      success: true, 
      content: optimizedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur dans la fonction optimize-content:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
