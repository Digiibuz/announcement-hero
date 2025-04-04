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
  const [error, setError] = useState<string | null>(null);
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  useEffect(() => {
    fetchProfile().catch(error => {
      console.error("Error during initial profile check:", error);
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("User not logged in");
        throw new Error("User not logged in");
      }
      
      console.log("Sending get_profile request");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_profile' },
      });
      
      console.log("Response received:", response);
      
      if (response.error) {
        console.error("Edge Function Error:", response.error);
        throw new Error(response.error.message || "Error retrieving GMB profile");
      }
      
      const { profile } = response.data || {};
      
      if (profile) {
        setProfile(profile);
        setIsConnected(true);
      } else {
        setProfile(null);
        setIsConnected(false);
        console.log("No Google Business profile found for this user");
      }
      
      return profile;
    } catch (error: any) {
      console.error("Error retrieving GMB profile:", error);
      setError(`Failed to get profile: ${error.message || "Unknown error"}`);
      setIsConnected(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Sending get_auth_url request");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
      });
      
      console.log("Full Edge Function response:", response);
      
      if (response.error) {
        const errorMessage = response.error.message || "Failed to generate authorization URL";
        console.error("Edge Function Error:", response.error);
        
        if (errorMessage.includes("placeholder value") || errorMessage.includes("not defined")) {
          setError(`Configuration error: ${errorMessage}`);
          toast.error("Google API configuration error. Please check Edge Function logs.");
        } else {
          setError(`Authorization error: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }
      
      if (!response.data || !response.data.url) {
        console.error("Invalid Edge Function response (no URL):", response);
        setError("Missing authorization URL in response");
        throw new Error("Missing authorization URL in response");
      }
      
      console.log("Authentication URL obtained:", response.data.url);
      
      return response.data.url;
    } catch (error: any) {
      console.error("Error generating authorization URL:", error);
      setError(`Failed to get authentication URL: ${error.message || "Unknown error"}`);
      toast.error(`Error generating authorization URL: ${error.message || "Unknown error"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      if (callbackProcessed) {
        console.log("Callback already processed, skipping");
        return true;
      }

      setIsLoading(true);
      setError(null);
      setCallbackProcessed(true);
      
      console.log("Processing callback with code and state:", { codeLength: code.length, state });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("User not logged in when processing callback");
        setError("You must be logged in to connect your Google account");
        throw new Error("User not logged in");
      }
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'handle_callback', code, state },
      });
      
      console.log("Callback response:", response);
      
      if (response.error) {
        console.error("Error processing callback:", response.error);
        setError(`Authentication error: ${response.error.message || "Failed to connect to Google account"}`);
        throw new Error(response.error.message || "Error connecting to Google account");
      }
      
      toast.success("Google account connected successfully");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Error processing callback:", error);
      setError(`Authentication failed: ${error.message || "Unknown error"}`);
      toast.error("Error connecting to Google account");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, callbackProcessed]);

  const listAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Requesting accounts list");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_accounts' },
      });
      
      console.log("Accounts list response:", response);
      
      if (response.error) {
        console.error("Error retrieving accounts:", response.error);
        setError(`Failed to get accounts: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error retrieving accounts");
      }
      
      const accountsList = response.data?.accounts?.accounts || [];
      console.log("Accounts retrieved:", accountsList);
      
      setAccounts(accountsList);
      return accountsList;
    } catch (error: any) {
      console.error("Error retrieving accounts:", error);
      setError(`Failed to get accounts: ${error.message || "Unknown error"}`);
      toast.error("Error retrieving accounts");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listLocations = useCallback(async (accountId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Requesting locations list for account:", accountId);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_locations', account_id: accountId },
      });
      
      console.log("Locations list response:", response);
      
      if (response.error) {
        console.error("Error retrieving locations:", response.error);
        setError(`Failed to get locations: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error retrieving locations");
      }
      
      const locationsList = response.data?.locations?.locations || [];
      console.log("Locations retrieved:", locationsList);
      
      setLocations(locationsList);
      return locationsList;
    } catch (error: any) {
      console.error("Error retrieving locations:", error);
      setError(`Failed to get locations: ${error.message || "Unknown error"}`);
      toast.error("Error retrieving locations");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveLocation = useCallback(async (accountId: string, locationId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Saving location:", { accountId, locationId });
      
      const response = await supabase.functions.invoke('google-business', {
        body: { 
          action: 'save_location', 
          account_id: accountId, 
          location_id: locationId 
        },
      });
      
      console.log("Save location response:", response);
      
      if (response.error) {
        console.error("Error saving location:", response.error);
        setError(`Failed to save location: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error saving location");
      }
      
      toast.success("Location selected successfully");
      await fetchProfile();
      
      return true;
    } catch (error: any) {
      console.error("Error saving location:", error);
      setError(`Failed to save location: ${error.message || "Unknown error"}`);
      toast.error("Error saving location");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Requesting Google account disconnection");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'disconnect' },
      });
      
      console.log("Disconnection response:", response);
      
      if (response.error) {
        console.error("Error disconnecting:", response.error);
        setError(`Failed to disconnect: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error disconnecting Google account");
      }
      
      setProfile(null);
      setIsConnected(false);
      setAccounts([]);
      setLocations([]);
      
      toast.success("Google account disconnected successfully");
      
      return true;
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      setError(`Failed to disconnect: ${error.message || "Unknown error"}`);
      toast.error("Error disconnecting Google account");
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
    error,
    fetchProfile,
    getAuthUrl,
    handleCallback,
    listAccounts,
    listLocations,
    saveLocation,
    disconnect
  };
};
