
import { useState, useCallback, useEffect } from "react";
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

  // Vérifier la connexion au démarrage
  useEffect(() => {
    fetchProfile().catch(error => {
      console.error("Erreur lors de la vérification initiale du profil:", error);
    });
  }, []);

  // Récupérer le profil GMB de l'utilisateur
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("Utilisateur non connecté");
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
        console.error("Erreur Edge Function:", response.error);
        throw new Error(response.error.message || "Erreur lors de la récupération du profil GMB");
      }
      
      const { profile } = response.data || {};
      
      setProfile(profile);
      setIsConnected(!!profile);
      
      return profile;
    } catch (error: any) {
      console.error("Erreur lors de la récupération du profil GMB:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Générer l'URL d'autorisation OAuth
  const getAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Log pour débogage
      console.log("Envoi de la requête get_auth_url");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
      });
      
      // Log détaillé pour débogage
      console.log("Réponse complète de l'Edge Function:", response);
      
      if (response.error) {
        console.error("Erreur de l'Edge Function:", response.error);
        throw new Error(response.error.message || "Erreur lors de la génération de l'URL d'autorisation");
      }
      
      if (!response.data || !response.data.url) {
        console.error("Réponse invalide de l'Edge Function (pas d'URL):", response);
        throw new Error("URL d'autorisation manquante dans la réponse");
      }
      
      // Log pour débogage
      console.log("URL d'authentification obtenue:", response.data.url);
      
      return response.data.url;
    } catch (error: any) {
      console.error("Erreur lors de la génération de l'URL d'autorisation:", error);
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
      
      console.log("Traitement du callback avec code et state:", { codeLength: code.length, state });
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'handle_callback', code, state },
      });
      
      console.log("Réponse du callback:", response);
      
      if (response.error) {
        console.error("Erreur lors du traitement du callback:", response.error);
        throw new Error(response.error.message || "Erreur lors de la connexion au compte Google");
      }
      
      toast.success("Compte Google connecté avec succès");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors du traitement du callback:", error);
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
      
      console.log("Demande de liste des comptes");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_accounts' },
      });
      
      console.log("Réponse de liste des comptes:", response);
      
      if (response.error) {
        console.error("Erreur lors de la récupération des comptes:", response.error);
        throw new Error(response.error.message || "Erreur lors de la récupération des comptes");
      }
      
      const accountsList = response.data?.accounts?.accounts || [];
      console.log("Comptes récupérés:", accountsList);
      
      setAccounts(accountsList);
      return accountsList;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des comptes:", error);
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
      
      console.log("Demande de liste des établissements pour le compte:", accountId);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_locations', account_id: accountId },
      });
      
      console.log("Réponse de liste des établissements:", response);
      
      if (response.error) {
        console.error("Erreur lors de la récupération des établissements:", response.error);
        throw new Error(response.error.message || "Erreur lors de la récupération des établissements");
      }
      
      const locationsList = response.data?.locations?.locations || [];
      console.log("Établissements récupérés:", locationsList);
      
      setLocations(locationsList);
      return locationsList;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des établissements:", error);
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
      
      console.log("Sauvegarde de l'établissement:", { accountId, locationId });
      
      const response = await supabase.functions.invoke('google-business', {
        body: { 
          action: 'save_location', 
          account_id: accountId, 
          location_id: locationId 
        },
      });
      
      console.log("Réponse de sauvegarde de l'établissement:", response);
      
      if (response.error) {
        console.error("Erreur lors de la sauvegarde de l'établissement:", response.error);
        throw new Error(response.error.message || "Erreur lors de la sauvegarde de l'établissement");
      }
      
      toast.success("Établissement sélectionné avec succès");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde de l'établissement:", error);
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
      
      console.log("Demande de déconnexion du compte Google");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'disconnect' },
      });
      
      console.log("Réponse de déconnexion:", response);
      
      if (response.error) {
        console.error("Erreur lors de la déconnexion:", response.error);
        throw new Error(response.error.message || "Erreur lors de la déconnexion du compte Google");
      }
      
      setProfile(null);
      setIsConnected(false);
      setAccounts([]);
      setLocations([]);
      
      toast.success("Compte Google déconnecté avec succès");
      
      return true;
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
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
    fetchProfile,
    getAuthUrl,
    handleCallback,
    listAccounts,
    listLocations,
    saveLocation,
    disconnect
  };
};
