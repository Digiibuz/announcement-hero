
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

  // Récupérer le profil GMB de l'utilisateur
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Utilisateur non connecté");
      }
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_profile' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const { profile } = response.data;
      
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
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
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
