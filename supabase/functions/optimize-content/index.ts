import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";

// Récupérer la clé API depuis les variables d'environnement de manière sécurisée
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    console.log("Fonction optimize-content appelée");
    
    const { type, title, description } = await req.json();
    
    console.log(`Paramètres reçus - Type: ${type}, Titre: "${title?.substring(0, 20)}..."`);
    if (description) {
      console.log(`Description: "${description.substring(0, 30)}..."`);
    }
    
    let prompt = "";
    let systemMessage = "";
    
    // Configure le prompt selon le type d'optimisation
    switch (type) {
      case "description":
        systemMessage = "Tu es un rédacteur professionnel. Reprend le texte et améliore seulement les tournures de phrase. Conserve la structure et les informations d'origine. IMPORTANT: Fournis UNIQUEMENT le texte réécrit, sans préface ni commentaire.";
        prompt = `Voici un contenu à améliorer: "${description}". Reprend ce texte et améliore seulement les tournures de phrase. Ne change pas le sens du texte, ne rajoute pas d'informations supplémentaires, n'ajoute pas de titre, ne mets aucun mot en gras, ne crée pas d'exemples, n'ajoute pas d'icônes, et ne change pas le formatage original. Ne commence pas ta réponse par une phrase d'introduction et n'ajoute pas de commentaires à la fin.`;
        break;
      case "generateDescription":
        systemMessage = "Tu es un rédacteur professionnel spécialisé dans la création de contenu pour des annonces. Rédige un texte informatif, structuré et engageant d'environ 200 mots basé sur le titre fourni. IMPORTANT: Fournis UNIQUEMENT le texte généré, sans préface ni commentaire.";
        prompt = `Titre de l'annonce: "${title}".
        ${description ? `Voici un exemple de contenu ou notes: "${description}"` : ""}
        
        Rédige un texte structuré, informatif et engageant d'environ 200 mots qui servira de description pour cette annonce. 
        Ton texte doit:
        - Avoir une structure claire avec des paragraphes
        - Inclure des points importants qui valorisent l'annonce
        - Utiliser un ton professionnel mais chaleureux
        - Ne pas contenir de titre ni sous-titres
        - Ne pas inclure de formatage spécial (pas de gras, italique...)
        
        Renvoie uniquement le texte généré sans aucune introduction ou commentaire supplémentaire.`;
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
        throw new Error(`Type d'optimisation non supporté: ${type}`);
    }

    console.log(`Type d'optimisation: ${type}, appel à OpenAI en cours...`);

    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI manquante. Veuillez configurer la variable d'environnement OPENAI_API_KEY.");
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
        temperature: type === "generateDescription" ? 0.8 : 0.7, // Un peu plus de créativité pour la génération
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Erreur OpenAI:", error);
      throw new Error(`Erreur OpenAI: ${error.error?.message || 'Erreur inconnue'}`);
    }

    const data = await response.json();
    console.log("Réponse OpenAI reçue avec succès");
    
    let optimizedContent = data.choices[0].message.content;
    
    // Post-traitement pour retirer tout texte introductif ou commentaire
    optimizedContent = optimizedContent
      // Supprime les phrases d'introduction comme "Voici" ou "Bien sûr"
      .replace(/^(Bien sûr !|Voici|Certainement|D'accord|Absolument|Voilà|Avec plaisir)[^\n]*\n+/i, '')
      // Supprime les commentaires finaux commençant par des tirets ou des remarques
      .replace(/\n+(-{2,}|Remarque|Note|Cette version)[^\n]*$/i, '')
      // Supprime les guillemets qui pourraient entourer la réponse
      .replace(/^["\s]+|["\s]+$/g, '')
      // Supprime les titres (lignes suivies de ':' ou lignes avec # au début)
      .replace(/^#+\s+.*$|^\s*[\w\s]+\s*:\s*$/gm, '')
      // Supprime les exemples entre parenthèses ou qui commencent par "Exemple :"
      .replace(/\(exemple.*?\)|exemple\s*:.*?(\n|$)/gi, '')
      // Supprime toutes les mises en gras (balises Markdown ** ou __)
      .replace(/(\*\*|__)(.*?)(\*\*|__)/g, "$2")
      // Supprime les marqueurs d'icônes et symboles courants
      .replace(/:[a-z_]+:|🔍|✅|⚠️|❗|📝|💡|🔑|📊|🎯|⭐|👉|✨|🚀|💪|⚡|📌|🔖|📢|🔔/g, '')
      .trim();

    console.log("Contenu optimisé traité: ", optimizedContent.substring(0, 100) + "...");

    return new Response(JSON.stringify({ 
      success: true, 
      content: optimizedContent 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Utilise notre fonction d'erreur sécurisée
    return errorResponse(error);
  }
});
