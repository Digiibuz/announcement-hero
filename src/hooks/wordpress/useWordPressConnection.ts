
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ConnectionStatus, ConnectionCheckResult } from "./connection/types";
import { useConnectionState } from "./connection/useConnectionState";
import { useUrlAccessibility } from "./connection/useUrlAccessibility";
import { useApiAuthentication } from "./connection/useApiAuthentication";
import { useApiTests } from "./connection/useApiTests";
import { useErrorHandler } from "./connection/useErrorHandler";

export { ConnectionStatus } from "./connection/types";

export const useWordPressConnection = () => {
  const { user } = useAuth();
  const { 
    status, 
    isChecking, 
    errorDetails, 
    startChecking, 
    finishChecking, 
    updateStatus 
  } = useConnectionState();
  const { testUrlAccessibility } = useUrlAccessibility();
  const { prepareAuthHeaders } = useApiAuthentication();
  const { testApiAuthentication } = useApiTests();
  const { formatConnectionError } = useErrorHandler();

  const checkConnection = async (configId?: string): Promise<ConnectionCheckResult> => {
    const wordpressConfigId = configId || user?.wordpressConfigId;
    
    if (!wordpressConfigId) {
      updateStatus("disconnected", "Aucune configuration WordPress associée");
      return { success: false, message: "Aucune configuration WordPress associée" };
    }

    try {
      startChecking();

      // Get the WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        updateStatus("disconnected", "Échec de récupération de la configuration");
        return { success: false, message: "Échec de récupération de la configuration" };
      }

      if (!wpConfig) {
        updateStatus("disconnected", "Configuration WordPress introuvable");
        return { success: false, message: "Configuration WordPress introuvable" };
      }

      // Normalize the URL (remove double slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // Test site accessibility before trying API connection
      const accessibilityCheck = await testUrlAccessibility(siteUrl);
      if (!accessibilityCheck.accessible) {
        console.error("WordPress site not accessible:", accessibilityCheck.error);
        updateStatus("disconnected", `Erreur réseau: impossible d'accéder au site WordPress. ${accessibilityCheck.error || ''}`);
        return { 
          success: false, 
          message: `Erreur réseau: impossible d'accéder au site WordPress`,
          details: accessibilityCheck.error
        };
      }

      // Try to fetch WordPress site info as a connection test
      const infoUrl = `${siteUrl}/wp-json`;
      
      const { headers } = prepareAuthHeaders(
        wpConfig.app_username, 
        wpConfig.app_password, 
        wpConfig.rest_api_key
      );
      
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error("WordPress connection test failed:", response.statusText);
        
        let errorMsg = `Échec de connexion: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMsg = "L'API REST WordPress n'est pas accessible à cette URL";
        } else if (response.status === 401 || response.status === 403) {
          errorMsg = "Identifiants incorrects ou autorisations insuffisantes";
        }
        
        updateStatus("disconnected", errorMsg);
        return { success: false, message: errorMsg };
      }

      // Test authentication if present
      const authResult = await testApiAuthentication(
        siteUrl,
        wpConfig.app_username,
        wpConfig.app_password,
        wpConfig.rest_api_key
      );
      
      if (!authResult.success) {
        updateStatus("disconnected", authResult.message);
        return authResult;
      }

      // If we got here, connection is successful
      const data = await response.json();
      updateStatus("connected", null);
      return { success: true, message: "Connexion établie avec succès", data };

    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      
      const errorMessage = formatConnectionError(error);
      updateStatus("disconnected", errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      finishChecking();
    }
  };

  return {
    status,
    isChecking,
    errorDetails,
    checkConnection
  };
};
