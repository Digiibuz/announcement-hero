
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "unknown";

export const useWordPressConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fonction utilitaire pour normaliser les URL WordPress
  const normalizeUrl = (url: string) => {
    // Supprimer les barres obliques finales pour éviter les doubles barres
    return url.endsWith('/') ? url.slice(0, -1) : url;
  };

  const checkConnection = async (configId?: string) => {
    const wordpressConfigId = configId || user?.wordpressConfigId;
    
    if (!wordpressConfigId) {
      setStatus("disconnected");
      setError("Aucune configuration WordPress associée");
      return { success: false, message: "Aucune configuration WordPress associée" };
    }

    try {
      setIsChecking(true);
      setStatus("checking");
      setError(null);

      // Get the WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        setStatus("disconnected");
        setError("Échec de récupération de la configuration");
        return { success: false, message: "Échec de récupération de la configuration" };
      }

      if (!wpConfig) {
        setStatus("disconnected");
        setError("Configuration WordPress introuvable");
        return { success: false, message: "Configuration WordPress introuvable" };
      }

      // Normaliser l'URL du site pour éviter les problèmes de double barre oblique
      const siteUrl = normalizeUrl(wpConfig.site_url);
      console.log("URL normalisée:", siteUrl);

      // Try to fetch the WordPress site info as a connection test
      const infoUrl = `${siteUrl}/wp-json`;
      
      // Préparer les en-têtes d'authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      let authenticationUsed = false;
      
      // Utiliser Application Password si disponible
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        authenticationUsed = true;
        console.log("Utilisation de l'authentification par Application Password");
      } 
      // Fallback sur la clé API REST si présente
      else if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
        authenticationUsed = true;
        console.log("Utilisation de l'authentification par clé API REST");
      } else {
        console.log("Aucune méthode d'authentification fournie");
      }
      
      console.log("Vérification de la connexion à:", infoUrl);
      
      try {
        const response = await fetch(infoUrl, {
          method: 'GET',
          headers: headers,
          // Ajouter mode: 'cors' pour être explicite sur le type de requête
          mode: 'cors'
        });

        if (!response.ok) {
          console.error("WordPress connection test failed:", response.statusText);
          setStatus("disconnected");
          setError(`Échec de connexion: ${response.statusText}`);
          return { success: false, message: `Échec de connexion: ${response.statusText}` };
        }

        // Si l'authentification est utilisée, essayons d'accéder à un point d'extrémité
        // qui nécessite des autorisations pour valider les identifiants
        if (authenticationUsed) {
          try {
            // Test avec les catégories (généralement requiert authentification)
            const authTestUrl = `${siteUrl}/wp-json/wp/v2/categories`;
            console.log("Test d'authentification avec:", authTestUrl);
            
            const authTest = await fetch(authTestUrl, {
              method: 'GET',
              headers: headers,
              mode: 'cors'
            });
            
            if (!authTest.ok) {
              console.warn("Test d'authentification échoué:", authTest.statusText);
              if (authTest.status === 401 || authTest.status === 403) {
                setStatus("disconnected");
                setError("Identifiants incorrects ou autorisations insuffisantes");
                return { 
                  success: false, 
                  message: "Identifiants incorrects ou autorisations insuffisantes" 
                };
              }
            } else {
              // Test réussi avec catégories, vérifier aussi les pages
              const pagesTestUrl = `${siteUrl}/wp-json/wp/v2/pages`;
              console.log("Test d'authentification (pages) avec:", pagesTestUrl);
              
              const pagesTest = await fetch(pagesTestUrl, {
                method: 'GET',
                headers: headers,
                mode: 'cors'
              });

              if (!pagesTest.ok) {
                console.warn("Test des pages échoué:", pagesTest.statusText);
                if (pagesTest.status === 401 || pagesTest.status === 403) {
                  setStatus("disconnected");
                  setError("Autorisations insuffisantes pour les pages");
                  return { 
                    success: false, 
                    message: "Autorisations insuffisantes pour les pages" 
                  };
                }
              }
            }
          } catch (authError: any) {
            console.error("Erreur pendant le test d'authentification:", authError);
            setStatus("disconnected");
            setError(`Erreur d'authentification: ${authError.message || "Erreur inconnue"}`);
            return { 
              success: false, 
              message: `Erreur d'authentification: ${authError.message || "Erreur inconnue"}` 
            };
          }
        }

        // Connection test succeeded
        const data = await response.json();
        setStatus("connected");
        setError(null);
        return { success: true, message: "Connexion établie avec succès", data };

      } catch (fetchError: any) {
        console.error("Erreur de connexion avec fetch:", fetchError);
        setStatus("disconnected");
        
        // Détection des erreurs CORS et réseau
        let errorMessage = "Échec de connexion";
        
        if (fetchError.message === "Failed to fetch") {
          errorMessage = "Échec de connexion: Problème réseau ou CORS. Vérifiez l'URL et assurez-vous que le site WordPress est accessible.";
        } else {
          errorMessage = `Échec de connexion: ${fetchError.message}`;
        }
        
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }

    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      setStatus("disconnected");
      setError(error.message || "Erreur de connexion");
      return { success: false, message: error.message || "Erreur de connexion" };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    status,
    isChecking,
    error,
    checkConnection
  };
};
