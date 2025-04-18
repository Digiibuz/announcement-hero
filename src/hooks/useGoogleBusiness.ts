
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
  const [debugInfo, setDebugInfo] = useState<{
    lastApiCall: string;
    lastResponse: any;
  }>({ lastApiCall: '', lastResponse: null });

  useEffect(() => {
    console.log("Initializing useGoogleBusiness hook");
    fetchProfile().catch(error => {
      console.error("Error during initial profile check:", error);
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(prev => ({ ...prev, lastApiCall: 'get_profile' }));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("User not logged in");
        setDebugInfo(prev => ({ ...prev, lastResponse: { error: "User not logged in" } }));
        throw new Error("User not logged in");
      }
      
      console.log("Sending get_profile request with auth token length:", session.access_token.length);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_profile' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      console.log("Response received:", response);
      setDebugInfo(prev => ({ ...prev, lastResponse: response }));
      
      if (response.error) {
        console.error("Edge Function Error:", response.error);
        throw new Error(response.error.message || "Error retrieving GMB profile");
      }
      
      const { profile } = response.data || {};
      
      console.log("Profile data returned:", profile);
      
      if (profile) {
        console.log("Google profile found, setting connected state");
        setProfile(profile);
        setIsConnected(true);
      } else {
        console.log("No Google Business profile found for this user - this is normal if not yet connected");
        setProfile(null);
        setIsConnected(false);
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
      setDebugInfo(prev => ({ ...prev, lastApiCall: 'get_auth_url' }));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("User not logged in when requesting auth URL");
        throw new Error("You must be logged in to connect your Google account");
      }
      
      console.log("Sending get_auth_url request");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      console.log("Full Edge Function response:", response);
      setDebugInfo(prev => ({ ...prev, lastResponse: response }));
      
      if (response.error) {
        const errorMessage = response.error.message || "Failed to generate authorization URL";
        console.error("Edge Function Error:", response.error);
        
        // More specific error handling
        if (errorMessage.includes("placeholder value") || errorMessage.includes("not defined")) {
          setError(`Configuration error: ${errorMessage}`);
          toast.error("Google API configuration error. Please check Edge Function logs.");
        } else if (errorMessage.includes("authenticated")) {
          setError("Authentication required: Please log in first");
          toast.error("You must be logged in to connect your Google account");
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
      setDebugInfo(prev => ({ ...prev, lastApiCall: 'handle_callback' }));
      
      console.log("Processing callback with code and state:", { codeLength: code.length, state });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("User not logged in when processing callback");
        setError("You must be logged in to connect your Google account");
        throw new Error("User not logged in");
      }
      
      // Make sure to pass both code and state in the request body
      const response = await supabase.functions.invoke('google-business', {
        body: { 
          action: 'handle_callback', 
          code, 
          state 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      console.log("Callback response:", response);
      setDebugInfo(prev => ({ ...prev, lastResponse: response }));
      
      if (response.error) {
        console.error("Error processing callback:", response.error);
        setError(`Authentication error: ${response.error.message || "Failed to connect to Google account"}`);
        throw new Error(response.error.message || "Error connecting to Google account");
      }
      
      // Immediately check if the profile was created
      console.log("Callback successful, refreshing profile to verify creation");
      const newProfile = await fetchProfile();
      
      if (!newProfile) {
        console.warn("Profile not found after successful callback - this might indicate a database issue");
        // Just a warning, not an error - we'll try again later
        console.log("Will retry profile fetch in 2 seconds...");
        
        // Add a delayed retry to give the database time to catch up
        setTimeout(async () => {
          console.log("Retrying profile fetch...");
          const retryProfile = await fetchProfile();
          
          if (retryProfile) {
            console.log("Profile successfully retrieved on retry:", retryProfile);
            toast.success("Google account connected successfully");
          } else {
            console.error("Profile still not found after retry");
            setError("Profile connection succeeded but profile was not found in database after retry");
            toast.error("Connection partially successful - please try refreshing");
          }
        }, 2000);
      } else {
        console.log("Profile successfully retrieved after callback:", newProfile);
        toast.success("Google account connected successfully");
      }
      
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
    debugInfo,
    callbackProcessed,
    fetchProfile,
    getAuthUrl,
    handleCallback,
    listAccounts,
    listLocations,
    saveLocation,
    disconnect
  };
};
