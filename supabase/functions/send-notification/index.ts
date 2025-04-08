
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Création du client Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Récupération du corps de la requête
    const requestBody = await req.json();
    const { 
      userId, 
      userIds,
      templateId, 
      title, 
      content, 
      type, 
      metadata, 
      sendToUsers
    } = requestBody;

    console.log("Request received:", {
      sendToUsers,
      userId: userId || "N/A",
      userIds: userIds ? `${userIds.length} users` : "N/A",
      templateId: templateId || "N/A",
      hasTitle: !!title,
      hasContent: !!content
    });

    // Validation des paramètres
    if (!sendToUsers && !userId) {
      return new Response(
        JSON.stringify({ error: "L'ID de l'utilisateur est requis lorsque sendToUsers est false" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (sendToUsers && (!userIds || userIds.length === 0)) {
      return new Response(
        JSON.stringify({ error: "La liste des utilisateurs ne peut pas être vide lorsque sendToUsers est true" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if ((!templateId && (!title || !content || !type))) {
      return new Response(
        JSON.stringify({ 
          error: "Soit templateId, soit title, content et type sont requis" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que le type est valide si fourni
    if (type && !["reminder", "alert", "info"].includes(type)) {
      return new Response(
        JSON.stringify({ 
          error: "Le type doit être 'reminder', 'alert' ou 'info'" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Si un templateId est fourni, récupérer les détails du template
    let notificationData = {};
    
    if (templateId) {
      const { data: template, error: templateError } = await supabaseClient
        .from("notification_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de la récupération du template", 
            details: templateError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      notificationData = {
        title: template.title,
        content: template.content,
        type: template.type,
        template_id: templateId
      };
    } else {
      notificationData = {
        title,
        content,
        type
      };
    }

    console.log("Notification data prepared:", notificationData);

    // APPROCHE POUR ENVOYER À PLUSIEURS UTILISATEURS SPÉCIFIQUES
    if (sendToUsers) {
      if (!userIds || userIds.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "La liste des utilisateurs ne peut pas être vide" 
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Sending notifications to ${userIds.length} specified users`);

      // Vérifier les préférences de notification pour chaque utilisateur
      const { data: preferences, error: preferencesError } = await supabaseClient
        .from("notification_preferences")
        .select("*")
        .in("user_id", userIds);

      if (preferencesError) {
        console.error("Error fetching notification preferences:", preferencesError);
      }

      // Créer un map des préférences par user_id
      const preferencesMap = new Map();
      if (preferences) {
        preferences.forEach(pref => {
          preferencesMap.set(pref.user_id, pref);
        });
      }

      // Filtrer les utilisateurs qui ont désactivé ce type de notification
      const filteredUserIds = userIds.filter(uid => {
        const userPref = preferencesMap.get(uid);
        if (!userPref) return true; // Si pas de préférences, autoriser par défaut
        
        const typeEnabledField = `${notificationData.type}_enabled`;
        return userPref[typeEnabledField] !== false;
      });

      if (filteredUserIds.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Tous les utilisateurs sélectionnés ont désactivé ce type de notification",
            count: 0
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Préparer un tableau d'objets pour l'insertion en une seule requête
      const notificationsToInsert = filteredUserIds.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type,
        template_id: notificationData.template_id || null,
        metadata: metadata || null
      }));

      // Insérer toutes les notifications en une seule opération
      const { error: insertError } = await supabaseClient
        .from("user_notifications")
        .insert(notificationsToInsert);
        
      if (insertError) {
        console.error("Error inserting batch notifications:", insertError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de l'insertion des notifications", 
            details: insertError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Successfully sent ${filteredUserIds.length} notifications`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Notifications envoyées à ${filteredUserIds.length} utilisateurs`,
          count: filteredUserIds.length,
          skippedCount: userIds.length - filteredUserIds.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Cas d'un envoi à un utilisateur spécifique
      
      // Vérifier les préférences de notification de l'utilisateur
      const { data: preferences, error: preferencesError } = await supabaseClient
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (preferencesError && preferencesError.code !== "PGRST116") {
        console.error("Erreur lors de la récupération des préférences:", preferencesError);
      }

      // Si l'utilisateur a désactivé ce type de notification, ne pas l'envoyer
      if (preferences) {
        const typeEnabledField = `${notificationData.type}_enabled`;
        if (preferences[typeEnabledField] === false) {
          return new Response(
            JSON.stringify({ 
              message: "L'utilisateur a désactivé ce type de notification" 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      console.log(`Sending notification to user: ${userId}`);

      // Insérer la notification dans la base de données
      const { data: notification, error: insertError } = await supabaseClient
        .from("user_notifications")
        .insert({
          user_id: userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          template_id: notificationData.template_id || null,
          metadata: metadata || null
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting notification:", insertError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de l'insertion de la notification", 
            details: insertError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Notification sent successfully");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification envoyée avec succès", 
          notification 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur inattendue s'est produite", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
