
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
        systemMessage = "Tu es un rédacteur professionnel. Améliore ce contenu pour le rendre clair, concis et professionnel. Maintiens le style formel mais accessible, et assure-toi que toutes les informations importantes sont préservées.";
        prompt = `Voici un contenu à améliorer: "${description}". Réécris ce texte en le rendant plus professionnel, bien structuré et attrayant pour les lecteurs.`;
        break;
      case "seoTitle":
        systemMessage = "Tu es un expert en SEO. Crée un titre optimisé pour les moteurs de recherche basé sur le contenu fourni. Le titre doit être accrocheur, pertinent et contenir des mots-clés importants. Maximum 60 caractères.";
        prompt = `Voici le titre actuel: "${title}" et la description: "${description}". Génère un titre SEO optimisé d'environ 50-60 caractères basé sur ce contenu.`;
        break;
      case "seoDescription":
        systemMessage = "Tu es un expert en SEO. Crée une méta-description optimisée pour les moteurs de recherche basée sur le contenu fourni. La description doit être informative, inciter à l'action, et contenir des mots-clés importants. Maximum 155 caractères.";
        prompt = `Voici le titre: "${title}" et la description: "${description}". Génère une méta-description SEO d'environ 120-155 caractères qui résume le contenu de manière attrayante.`;
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
    
    const optimizedContent = data.choices[0].message.content;

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
