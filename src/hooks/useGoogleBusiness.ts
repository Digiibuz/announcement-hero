
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
    additionalInfo?: string;
  }>({ lastApiCall: '', lastResponse: null });
  const [noLocationsFound, setNoLocationsFound] = useState(false);

  useEffect(() => {
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
      
      console.log("Sending get_profile request");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_profile' },
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
      
      console.log("Sending get_auth_url request");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'get_auth_url' },
      });
      
      console.log("Full Edge Function response:", response);
      setDebugInfo(prev => ({ ...prev, lastResponse: response }));
      
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
      setDebugInfo(prev => ({ ...prev, lastApiCall: 'handle_callback' }));
      
      console.log("Processing callback with code and state:", { codeLength: code.length, state });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("User not logged in when processing callback");
        setError("You must be logged in to connect your Google account");
        setCallbackProcessed(false); // Reset to allow retrying
        throw new Error("User not logged in");
      }
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'handle_callback', code, state },
      });
      
      console.log("Callback response:", response);
      setDebugInfo(prev => ({ ...prev, lastResponse: response }));
      
      if (response.error) {
        console.error("Error processing callback:", response.error);
        setError(`Authentication error: ${response.error.message || "Failed to connect to Google account"}`);
        setCallbackProcessed(false); // Reset to allow retrying
        throw new Error(response.error.message || "Error connecting to Google account");
      }
      
      console.log("Callback successful, refreshing profile to verify creation");
      const newProfile = await fetchProfile();
      
      if (!newProfile) {
        console.warn("Profile not found after successful callback - this might indicate a database issue");
        console.log("Will retry profile fetch in 2 seconds...");
        
        // Try up to 3 times with increasing delays
        setTimeout(async () => {
          console.log("Retrying profile fetch (1st attempt)...");
          const retryProfile = await fetchProfile();
          
          if (retryProfile) {
            console.log("Profile successfully retrieved on retry:", retryProfile);
            toast.success("Google account connected successfully");
            
            // Auto-load accounts after successful connection
            setTimeout(() => {
              listAccounts().catch(e => {
                console.error("Error auto-loading accounts after connection:", e);
              });
            }, 500);
          } else {
            console.error("Profile still not found after 1st retry");
            
            // Try again after a longer delay
            setTimeout(async () => {
              console.log("Retrying profile fetch (2nd attempt)...");
              const secondRetryProfile = await fetchProfile();
              
              if (secondRetryProfile) {
                console.log("Profile successfully retrieved on 2nd retry:", secondRetryProfile);
                toast.success("Google account connected successfully");
                
                // Auto-load accounts after successful connection
                setTimeout(() => {
                  listAccounts().catch(e => {
                    console.error("Error auto-loading accounts after connection:", e);
                  });
                }, 500);
              } else {
                console.error("Profile still not found after multiple retries");
                setError("Profile connection succeeded but profile was not found in database after retries");
                toast.error("Connection partially successful - please try refreshing");
              }
            }, 3000);
          }
        }, 2000);
      } else {
        console.log("Profile successfully retrieved after callback:", newProfile);
        toast.success("Google account connected successfully");
        
        // Auto-load accounts after successful connection
        setTimeout(() => {
          listAccounts().catch(e => {
            console.error("Error auto-loading accounts after connection:", e);
          });
        }, 500);
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
      setNoLocationsFound(false);
      
      console.log("Requesting accounts list");
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_accounts' },
      });
      
      console.log("Accounts list response:", response);
      setDebugInfo(prev => ({ 
        ...prev, 
        lastApiCall: 'list_accounts', 
        lastResponse: response 
      }));
      
      if (response.error) {
        console.error("Error retrieving accounts:", response.error);
        setError(`Failed to get accounts: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error retrieving accounts");
      }
      
      // Vérifier si les comptes sont définis et ont une structure valide
      if (!response.data || !response.data.accounts) {
        console.error("Invalid response structure - missing accounts data");
        setDebugInfo(prev => ({ 
          ...prev, 
          additionalInfo: "Response did not contain expected accounts data structure" 
        }));
        setError("La réponse ne contient pas de données de compte attendues");
        return [];
      }
      
      // Assurer que accounts est un tableau même s'il est vide ou undefined
      const accountsList = response.data.accounts?.accounts || [];
      console.log("Accounts retrieved:", accountsList);
      
      setAccounts(accountsList);
      
      if (accountsList.length === 0) {
        setNoLocationsFound(true);
        setDebugInfo(prev => ({ 
          ...prev, 
          additionalInfo: "No accounts found - this may indicate issues with Google My Business permissions" 
        }));
      } else {
        // Si nous avons des comptes, chargez automatiquement les emplacements pour le premier compte
        setTimeout(() => {
          if (accountsList.length > 0) {
            const firstAccountId = accountsList[0].name;
            console.log("Auto-loading locations for first account:", firstAccountId);
            listLocations(firstAccountId).catch(e => {
              console.error("Error auto-loading locations:", e);
            });
          }
        }, 500);
      }
      
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
      setNoLocationsFound(false);
      
      console.log("Requesting locations list for account:", accountId);
      
      const response = await supabase.functions.invoke('google-business', {
        body: { action: 'list_locations', account_id: accountId },
      });
      
      console.log("Locations list response:", response);
      setDebugInfo(prev => ({ 
        ...prev, 
        lastApiCall: 'list_locations', 
        lastResponse: response 
      }));
      
      if (response.error) {
        console.error("Error retrieving locations:", response.error);
        setError(`Failed to get locations: ${response.error.message || "Unknown error"}`);
        throw new Error(response.error.message || "Error retrieving locations");
      }
      
      // Vérifier si les emplacements sont définis et ont une structure valide
      if (!response.data || !response.data.locations) {
        console.error("Invalid response structure - missing locations data");
        setDebugInfo(prev => ({ 
          ...prev, 
          additionalInfo: "Response did not contain expected locations data structure" 
        }));
        setError("La réponse ne contient pas de données d'emplacement attendues");
        return [];
      }
      
      // Assurer que locations est un tableau même s'il est vide ou undefined
      const locationsList = response.data.locations?.locations || [];
      console.log("Locations retrieved:", locationsList);
      
      setLocations(locationsList);
      
      if (locationsList.length === 0) {
        setNoLocationsFound(true);
        setDebugInfo(prev => ({ 
          ...prev, 
          additionalInfo: "No locations found for this account - this may indicate issues with Google My Business permissions" 
        }));
      } else if (locationsList.length === 1) {
        // Si nous n'avons qu'un seul emplacement, sélectionnez-le automatiquement
        const onlyLocation = locationsList[0];
        console.log("Only one location found, auto-selecting:", onlyLocation.name);
        
        setTimeout(() => {
          saveLocation(accountId, onlyLocation.name).catch(e => {
            console.error("Error auto-selecting location:", e);
          });
        }, 500);
      }
      
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
      setDebugInfo(prev => ({ 
        ...prev, 
        lastApiCall: 'save_location', 
        lastResponse: response 
      }));
      
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
      setDebugInfo(prev => ({ 
        ...prev, 
        lastApiCall: 'disconnect', 
        lastResponse: response 
      }));
      
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
    noLocationsFound,
    fetchProfile,
    getAuthUrl,
    handleCallback,
    listAccounts,
    listLocations,
    saveLocation,
    disconnect
  };
};
