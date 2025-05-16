
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createServerSupabaseClient } from "../_shared/serverClient.ts";

serve(async (req) => {
  console.log("WordPress publish function called");
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  // Gérer CORS préalablement
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Vérifier la méthode HTTP
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        success: false,
        message: "Method not allowed",
      }), {
        status: 405,
        headers: { ...corsHeaders },
      });
    }

    // Initialiser le client Supabase
    const supabase = createServerSupabaseClient();
    if (!supabase) {
      return new Response(JSON.stringify({
        success: false,
        message: "Impossible d'initialiser le client Supabase",
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }

    // Analyser les données de la requête avec une meilleure gestion des erreurs
    let requestData;
    try {
      const requestText = await req.text();
      console.log("Request body raw:", requestText);
      
      if (!requestText || requestText.trim() === '') {
        return new Response(JSON.stringify({
          success: false,
          message: "Corps de la requête vide",
          debug: { 
            headers: Object.fromEntries(req.headers.entries()) 
          }
        }), {
          status: 400,
          headers: { ...corsHeaders },
        });
      }
      
      requestData = JSON.parse(requestText);
      console.log("Request data parsed:", requestData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({
        success: false,
        message: `Format JSON invalide: ${parseError.message}`,
        error: parseError.toString(),
        stack: parseError.stack
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    // Vérifier les champs obligatoires
    const { announcementId, userId, categoryId } = requestData;
    if (!announcementId || !userId || !categoryId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Champs obligatoires manquants: announcementId, userId, ou categoryId",
        received: { announcementId, userId, categoryId }
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    // Récupérer les données de l'annonce
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error("Erreur lors de la récupération de l'annonce:", announcementError);
      return new Response(JSON.stringify({
        success: false,
        message: `Annonce non trouvée: ${announcementError?.message || "Erreur inconnue"}`,
        error: announcementError
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("Annonce trouvée:", announcement.title);

    // Récupérer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("wordpress_config_id")
      .eq("id", userId)
      .single();

    if (profileError || !userProfile?.wordpress_config_id) {
      console.error("Erreur lors de la récupération du profil utilisateur:", profileError);
      return new Response(JSON.stringify({
        success: false,
        message: `Profil utilisateur non trouvé ou configuration WordPress manquante`,
        error: profileError
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("Profil utilisateur trouvé avec ID de config WordPress:", userProfile.wordpress_config_id);

    // Récupérer la configuration WordPress
    const { data: wpConfig, error: configError } = await supabase
      .from("wordpress_configs")
      .select("*")
      .eq("id", userProfile.wordpress_config_id)
      .single();

    if (configError || !wpConfig) {
      console.error("Erreur lors de la récupération de la configuration WordPress:", configError);
      return new Response(JSON.stringify({
        success: false,
        message: `Configuration WordPress non trouvée: ${configError?.message || "Erreur inconnue"}`,
        error: configError
      }), {
        status: 404,
        headers: { ...corsHeaders },
      });
    }

    console.log("Configuration WordPress trouvée:", {
      site_url: wpConfig.site_url,
      hasAppUsername: !!wpConfig.app_username,
      hasAppPassword: !!wpConfig.app_password
    });

    // Vérifier les identifiants WordPress
    if (!wpConfig.app_username || !wpConfig.app_password) {
      return new Response(JSON.stringify({
        success: false,
        message: "Identifiants WordPress manquants. Veuillez configurer les application passwords dans la configuration WordPress.",
      }), {
        status: 400,
        headers: { ...corsHeaders },
      });
    }

    // Vérification du format des identifiants
    console.log("Vérification des identifiants WordPress:");
    console.log("App username existe:", !!wpConfig.app_username);
    console.log("App username type:", typeof wpConfig.app_username);
    console.log("App username longueur:", wpConfig.app_username.length);
    console.log("App password existe:", !!wpConfig.app_password);
    console.log("App password type:", typeof wpConfig.app_password);
    console.log("App password longueur:", wpConfig.app_password.length);
    
    // Formater l'URL du site
    const siteUrl = wpConfig.site_url.endsWith("/")
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;

    // Vérifier les points de terminaison personnalisés
    console.log("Vérification des points de terminaison personnalisés...");

    // D'abord, vérifier les taxonomies personnalisées
    let useCustomTaxonomy = false;
    let customEndpointExists = false;
    let postEndpoint = `${siteUrl}/wp-json/wp/v2/posts`;

    try {
      console.log("Test du point de terminaison:", `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`);
      const taxonomyResponse = await fetch(
        `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`,
        { 
          method: "HEAD",
          headers: { 
            "Origin": "*",
            "Access-Control-Request-Method": "HEAD"
          }
        }
      );
      
      console.log("Statut de réponse de taxonomie:", taxonomyResponse.status);
      
      if (taxonomyResponse.status !== 404) {
        console.log("Point de terminaison de taxonomie DipiPixel trouvé!");
        useCustomTaxonomy = true;
        
        // Vérifier le type de publication personnalisé
        console.log("Test du point de terminaison:", `${siteUrl}/wp-json/wp/v2/dipi_cpt`);
        const cptResponse = await fetch(
          `${siteUrl}/wp-json/wp/v2/dipi_cpt`,
          { 
            method: "HEAD",
            headers: { 
              "Origin": "*",
              "Access-Control-Request-Method": "HEAD"
            }
          }
        );
        
        console.log("Statut de réponse de CPT:", cptResponse.status);
        
        if (cptResponse.status !== 404) {
          postEndpoint = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
          customEndpointExists = true;
          console.log("Utilisation du point de terminaison dipi_cpt");
        } else {
          // Vérifier le point de terminaison alternatif
          console.log("Test du point de terminaison:", `${siteUrl}/wp-json/wp/v2/dipicpt`);
          const altResponse = await fetch(
            `${siteUrl}/wp-json/wp/v2/dipicpt`,
            { 
              method: "HEAD",
              headers: { 
                "Origin": "*",
                "Access-Control-Request-Method": "HEAD"
              }
            }
          );
          
          console.log("Statut de réponse du point de terminaison alternatif:", altResponse.status);
          
          if (altResponse.status !== 404) {
            postEndpoint = `${siteUrl}/wp-json/wp/v2/dipicpt`;
            customEndpointExists = true;
            console.log("Utilisation du point de terminaison dipicpt");
          } else {
            console.log("Aucun point de terminaison personnalisé trouvé, utilisation de posts par défaut");
          }
        }
      } else {
        console.log("Aucune taxonomie DipiPixel trouvée, utilisation des catégories standard");
      }
    } catch (error) {
      console.log("Erreur lors de la vérification des points de terminaison personnalisés:", error);
      console.log("Utilisation du point de terminaison posts standard");
    }

    console.log("Utilisation du point de terminaison WordPress:", postEndpoint);

    // Créer les en-têtes d'authentification
    const credentials = `${wpConfig.app_username}:${wpConfig.app_password}`;
    console.log("Format des identifiants:", "username:password");
    
    // Encoder les identifiants en Base64
    const encodedCredentials = btoa(credentials);
    console.log("Utilisation des identifiants encodés de longueur:", encodedCredentials.length);
    
    // Créer l'en-tête d'authentification
    console.log("En-tête d'authentification créé avec succès en utilisant l'application password");
    
    // Préparer les en-têtes de requête complets
    const headers = {
      "Content-Type": "application/json",
      "Origin": "*",
      "Authorization": `Basic ${encodedCredentials}`
    };
    
    // Journalisation des en-têtes sans montrer la valeur réelle de l'authentification
    console.log("En-têtes créés:", JSON.stringify({...headers, "Authorization": "AUTH_HEADER_SET_BUT_NOT_DISPLAYED"}));

    // Préparer les données du post
    // Définir les catégories en fonction du type de point de terminaison
    let postData;
    if (useCustomTaxonomy && customEndpointExists) {
      console.log("Utilisation de la taxonomie personnalisée DipiPixel avec ID de catégorie:", categoryId);
      postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
        dipi_cpt_category: [parseInt(categoryId)]
      };
    } else {
      console.log("Utilisation des catégories WordPress standard avec ID:", categoryId);
      postData = {
        title: announcement.title,
        content: announcement.description || "",
        status: announcement.status === 'scheduled' ? 'future' : 'publish',
        categories: [parseInt(categoryId)]
      };
    }

    // Ajouter une date programmée si nécessaire
    if (announcement.status === 'scheduled' && announcement.publish_date) {
      postData.date = new Date(announcement.publish_date).toISOString();
    }

    // Ajouter une image à la une si disponible
    if (announcement.images && announcement.images.length > 0) {
      console.log("Image disponible dans l'annonce, tentative de téléchargement après création du post");
    }

    // Ajouter des métadonnées SEO si disponibles
    if (announcement.seo_title || announcement.seo_description) {
      postData.meta = {
        _yoast_wpseo_title: announcement.seo_title || "",
        _yoast_wpseo_metadesc: announcement.seo_description || ""
      };
    }

    console.log("Données du post préparées:", JSON.stringify(postData, null, 2));
    
    // Envoyer la requête à WordPress
    console.log("Envoi de la requête WordPress à:", postEndpoint);
    console.log("Avec en-têtes:", Object.keys(headers).join(", "));
    console.log("Méthode de requête: POST");
    
    // Envoyer la requête
    let wpResponse;
    try {
      wpResponse = await fetch(postEndpoint, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(postData)
      });

      console.log("Statut de réponse WordPress:", wpResponse.status);
      
      // Lire le corps de la réponse pour le journaliser
      const responseClone = wpResponse.clone();
      const responseText = await responseClone.text();
      console.log("Corps de la réponse WordPress:", responseText);
      
      // Recréer la réponse pour l'utiliser ensuite
      const responseBody = responseText;
      wpResponse = new Response(responseBody, {
        status: wpResponse.status,
        statusText: wpResponse.statusText,
        headers: wpResponse.headers
      });
      
    } catch (fetchError) {
      console.error("Erreur fetch:", fetchError);
      return new Response(JSON.stringify({
        success: false,
        message: `Erreur réseau: ${fetchError.message}`,
        error: fetchError.toString(),
        stack: fetchError.stack
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }
    
    // Traiter la réponse
    if (wpResponse.status !== 201 && wpResponse.status !== 200) {
      let errorText;
      try {
        errorText = await wpResponse.text();
      } catch (e) {
        errorText = "Impossible de lire la réponse d'erreur";
      }
      
      console.log("Réponse d'erreur WordPress:", errorText);
      return new Response(JSON.stringify({
        success: false,
        message: `Erreur API WordPress (${wpResponse.status}): ${errorText}`,
        details: { status: wpResponse.status }
      }), {
        status: wpResponse.status >= 400 && wpResponse.status < 600 ? wpResponse.status : 500,
        headers: { ...corsHeaders },
      });
    }

    // Analyser la réponse réussie
    let wpResponseData;
    try {
      const responseText = await wpResponse.text();
      console.log("Texte de réponse WordPress:", responseText);
      wpResponseData = JSON.parse(responseText);
      console.log("Réponse WordPress analysée avec succès");
    } catch (parseError) {
      console.error("Erreur d'analyse de la réponse WordPress:", parseError);
      return new Response(JSON.stringify({
        success: false,
        message: `Erreur d'analyse de la réponse WordPress: ${parseError.message}`,
        error: parseError.toString()
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }
    
    // Vérifier l'ID du post
    if (!wpResponseData || typeof wpResponseData.id !== 'number') {
      return new Response(JSON.stringify({
        success: false,
        message: "La réponse WordPress ne contenait pas d'ID de post valide",
        response: wpResponseData
      }), {
        status: 500,
        headers: { ...corsHeaders },
      });
    }

    console.log("Post créé avec succès avec ID:", wpResponseData.id);
    
    // Obtenir l'URL du post
    let postUrl = null;
    if (wpResponseData.link) {
      postUrl = wpResponseData.link;
      console.log("URL du post depuis la réponse:", postUrl);
    }
    
    // Image à la une si disponible
    if (announcement.images && announcement.images.length > 0 && wpResponseData.id) {
      try {
        console.log("Tentative de définir l'image à la une");
        const imageUrl = announcement.images[0];
        console.log("URL de l'image:", imageUrl);
        
        // D'abord, télécharger l'image
        let imageResponse;
        try {
          imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Échec du téléchargement de l'image: ${imageResponse.status}`);
          }
        } catch (imageError) {
          console.error("Erreur de téléchargement de l'image:", imageError);
          // Continuer avec la création du post, journaliser simplement l'erreur
        }
        
        if (imageResponse && imageResponse.ok) {
          // Obtenir l'image sous forme de blob
          const imageBlob = await imageResponse.blob();
          
          // Créer des données de formulaire pour le téléchargement de média
          const formData = new FormData();
          formData.append('file', new File([imageBlob], 'featured-image.jpg', { type: imageBlob.type || 'image/jpeg' }));
          
          // Télécharger vers la bibliothèque de médias WordPress
          const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
          console.log("Téléchargement vers le point de terminaison média:", mediaEndpoint);
          
          const mediaResponse = await fetch(mediaEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': headers.Authorization
            },
            body: formData
          });
          
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData && mediaData.id) {
              console.log("Média téléchargé avec succès avec ID:", mediaData.id);
              
              // Définir comme image à la une
              const updatePostEndpoint = `${postEndpoint}/${wpResponseData.id}`;
              const updateResponse = await fetch(updatePostEndpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                  featured_media: mediaData.id
                })
              });
              
              if (updateResponse.ok) {
                console.log("Image à la une définie avec succès");
              } else {
                console.error("Échec de la définition de l'image à la une:", await updateResponse.text());
              }
            }
          } else {
            console.error("Échec du téléchargement du média:", await mediaResponse.text());
          }
        }
      } catch (mediaError) {
        console.error("Erreur de gestion de l'image à la une:", mediaError);
        // Continuer avec la création du post, journaliser simplement l'erreur
      }
    }
    
    // Assigner des catégories si nécessaire
    console.log("Assignation de catégories au post", wpResponseData.id, { categoryId });
    
    try {
      console.log("Envoi de la requête d'assignation de catégorie");
      // L'implémentation dépend de la version de l'API REST WordPress
      const categoryAssignUrl = `${postEndpoint}/${wpResponseData.id}`;
      const categoryData = useCustomTaxonomy && customEndpointExists
          ? { dipi_cpt_category: [parseInt(categoryId)] }
          : { categories: [parseInt(categoryId)] };
            
      const catResponse = await fetch(categoryAssignUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(categoryData)
      });
      
      if (catResponse.ok) {
        console.log("Catégories assignées avec succès au post");
      } else {
        console.log("Réponse d'assignation de catégorie:", await catResponse.text());
      }
    } catch (error) {
      console.log("Erreur d'assignation de catégories:", error);
    }
    
    // Vérifier que le post a été publié avec succès
    console.log("Vérification de la publication du post pour l'ID", wpResponseData.id + "...");
    
    let verifiedPostUrl = null;
    
    try {
      // Stratégie 1: Vérification directe de l'API
      console.log("Stratégie 1: Tentative de vérification directe de l'API...");
      const verifyResponse = await fetch(`${siteUrl}/wp-json/wp/v2/${useCustomTaxonomy && customEndpointExists ? 'dipi_cpt' : 'posts'}/${wpResponseData.id}`, {
        method: "GET",
        headers: headers
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log("Données de vérification du post:", verifyData);
        
        if (verifyData && verifyData.status === "publish" && verifyData.link) {
          console.log("Post vérifié et publié à:", verifyData.link);
          verifiedPostUrl = verifyData.link;
          console.log("Vérification du post réussie avec la stratégie 1");
        }
      } else {
        console.log("Échec de la vérification avec statut:", verifyResponse.status);
      }
      
    } catch (error) {
      console.log("Erreur lors de la vérification du post:", error);
    }
    
    // Utiliser l'URL vérifiée ou revenir à l'URL de réponse
    const finalPostUrl = verifiedPostUrl || postUrl;
    if (finalPostUrl) {
      console.log("URL finale du post:", finalPostUrl);
    }
    
    // Mettre à jour l'enregistrement de l'annonce avec l'ID du post WordPress
    console.log("Mise à jour de l'annonce avec:", {
      wordpress_post_id: wpResponseData.id,
      is_divipixel: useCustomTaxonomy && customEndpointExists,
      wordpress_post_url: finalPostUrl
    });
    
    // Mettre à jour l'enregistrement de l'annonce
    const { error: updateError } = await supabase
      .from("announcements")
      .update({
        wordpress_post_id: wpResponseData.id,
        is_divipixel: useCustomTaxonomy && customEndpointExists
      })
      .eq("id", announcementId);
    
    if (updateError) {
      console.log("Erreur de mise à jour de l'enregistrement de l'annonce:", updateError);
      return new Response(JSON.stringify({
        success: true,
        message: "Post publié sur WordPress mais échec de mise à jour de l'enregistrement local",
        data: { wordpressPostId: wpResponseData.id, postUrl: finalPostUrl, isCustomPostType: useCustomTaxonomy && customEndpointExists }
      }), {
        status: 207, // Succès partiel
        headers: { ...corsHeaders },
      });
    }
    
    console.log("Mise à jour réussie de l'enregistrement de l'annonce avec l'ID de post WordPress:", wpResponseData.id);
    
    // Renvoyer une réponse de succès
    console.log("Processus de publication WordPress terminé avec succès");
    return new Response(JSON.stringify({
      success: true,
      message: "Publication réussie sur WordPress",
      data: {
        wordpressPostId: wpResponseData.id,
        postUrl: finalPostUrl,
        isCustomPostType: useCustomTaxonomy && customEndpointExists
      }
    }), {
      status: 200,
      headers: { ...corsHeaders },
    });
    
  } catch (error) {
    console.error("Erreur non gérée dans la fonction edge:", error);
    return new Response(JSON.stringify({
      success: false,
      message: `Erreur serveur: ${error.message || "Erreur inconnue"}`,
      error: error.toString(),
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders },
    });
  }
});
