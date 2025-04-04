
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleBusinessProfile } from "@/types/auth";

interface Account {
  name: string;
  accountName: string;
  accountNumber: string;
}

interface Location {
  name: string;
  locationName: string;
  title: string;
  address: {
    addressLines: string[];
    locality: string;
    postalCode: string;
    region: string;
    country: string;
  };
}

export const useGoogleBusiness = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [profile, setProfile] = useState<GoogleBusinessProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Récupérer le profil GMB de l'utilisateur
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Utilisateur non connecté");
      }
      
      // Log pour débogage
      console.log("Envoi de la requête get_profile");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_profile' },
      });
      
      // Log pour débogage
      console.log("Réponse reçue:", response);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { profile } = response.data;
      
      setProfile(profile);
      setIsConnected(!!profile);
      
      return profile;
    } catch (error: any) {
      console.error("Erreur lors de la récupération du profil GMB:", error);
      setErrorMessage(`Erreur lors de la récupération du profil GMB: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Générer l'URL d'autorisation OAuth
  const getAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Log pour débogage
      console.log("Envoi de la requête get_auth_url");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
      });
      
      // Log pour débogage en détail
      console.log("Réponse complète de l'Edge Function:", JSON.stringify(response, null, 2));
      
      if (response.error) {
        console.error("Erreur de l'Edge Function:", response.error);
        throw new Error(response.error.message || "Erreur lors de l'appel à l'Edge Function");
      }
      
      if (!response.data || !response.data.url) {
        console.error("Réponse d'URL reçue, mais sans URL:", response.data);
        throw new Error("L'URL d'authentification est vide ou non définie");
      }
      
      return response.data.url;
    } catch (error: any) {
      console.error("Erreur lors de la génération de l'URL d'autorisation:", error);
      const message = error.message || "Erreur inconnue";
      setErrorMessage(`Erreur lors de la génération de l'URL d'autorisation: ${message}`);
      toast.error("Erreur lors de la génération de l'URL d'autorisation");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Traiter le callback OAuth
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'handle_callback', code, state },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast.success("Compte Google connecté avec succès");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors du traitement du callback:", error);
      setErrorMessage(`Erreur lors du traitement du callback: ${error.message}`);
      toast.error("Erreur lors de la connexion au compte Google");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Lister les comptes GMB
  const listAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_accounts' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setAccounts(response.data.accounts.accounts || []);
      return response.data.accounts.accounts || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des comptes:", error);
      setErrorMessage(`Erreur lors de la récupération des comptes: ${error.message}`);
      toast.error("Erreur lors de la récupération des comptes");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lister les établissements d'un compte GMB
  const listLocations = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_locations', account_id: accountId },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setLocations(response.data.locations.locations || []);
      return response.data.locations.locations || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des établissements:", error);
      setErrorMessage(`Erreur lors de la récupération des établissements: ${error.message}`);
      toast.error("Erreur lors de la récupération des établissements");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder l'ID de l'établissement sélectionné
  const saveLocation = useCallback(async (accountId: string, locationId: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { 
          action: 'save_location', 
          account_id: accountId, 
          location_id: locationId 
        },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      toast.success("Établissement sélectionné avec succès");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde de l'établissement:", error);
      setErrorMessage(`Erreur lors de la sauvegarde de l'établissement: ${error.message}`);
      toast.error("Erreur lors de la sauvegarde de l'établissement");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  // Déconnecter le compte Google
  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'disconnect' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setProfile(null);
      setIsConnected(false);
      setAccounts([]);
      setLocations([]);
      
      toast.success("Compte Google déconnecté avec succès");
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      setErrorMessage(`Erreur lors de la déconnexion: ${error.message}`);
      toast.error("Erreur lors de la déconnexion du compte Google");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    isConnected,
    profile,
    accounts,
    locations,
    errorMessage,
    fetchProfile,
    getAuthUrl,
    handleCallback,
    listAccounts,
    listLocations,
    saveLocation,
    disconnect
  };
};
