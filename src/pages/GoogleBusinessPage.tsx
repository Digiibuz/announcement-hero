import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useGoogleBusiness } from "@/hooks/useGoogleBusiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, LogOut, MapPin, Store, ChevronRight, 
  RefreshCw, CheckCircle, ExternalLink, AlertCircle, Bug, AlertTriangle, Info, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const GoogleBusinessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { 
    isLoading, isConnected, profile, accounts, locations, error,
    fetchProfile, getAuthUrl, handleCallback,
    listAccounts, listLocations, saveLocation, disconnect,
    debugInfo, callbackProcessed, noLocationsFound, authInProgress
  } = useGoogleBusiness();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCallbackProcessing, setIsCallbackProcessing] = useState(false);
  const [showNoLocationsDialog, setShowNoLocationsDialog] = useState(false);
  const [showOAuthErrorDetails, setShowOAuthErrorDetails] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated && !searchParams.get("code") && !searchParams.get("error")) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate, searchParams]);
  
  useEffect(() => {
    const initProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (profile?.gmb_account_id) {
          setSelectedAccountId(profile.gmb_account_id);
        }
      } catch (err: any) {
        console.error("Error initializing profile:", err);
        setConnectionError(`Error initializing profile: ${err.message}`);
      }
    };
    
    if (isAuthenticated && !isCallbackProcessing) {
      initProfile();
    }
  }, [fetchProfile, isAuthenticated, isCallbackProcessing]);
  
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    const errorDescription = searchParams.get("error_description") || "Unknown error";
    
    if (error || errorCode) {
      console.error("OAuth error detected in URL:", { error, errorCode, errorDescription });
      
      const errorMessage = decodeURIComponent(errorDescription).replace(/\+/g, ' ');
      
      if (errorCode === "bad_oauth_state" || error?.includes("invalid_request")) {
        const stateErrorMsg = "Erreur d'authentification: Le paramètre state OAuth est invalide ou a expiré. Veuillez réessayer la connexion.";
        setConnectionError(stateErrorMsg);
        
        setTimeout(() => {
          toast.error(stateErrorMsg);
          setShowOAuthErrorDetails(true);
        }, 500);
        
        setTimeout(() => {
          navigate("/google-business", { replace: true });
        }, 100);
        return;
      }
      
      const generalErrorMsg = `Erreur d'authentification Google: ${errorMessage}`;
      setConnectionError(generalErrorMsg);
      toast.error("Authentication failed. Please try again.");
      
      setTimeout(() => {
        navigate("/google-business", { replace: true });
      }, 100);
      return;
    }
    
    if (code && state && !isCallbackProcessing) {
      setIsCallbackProcessing(true);
      console.log("Processing OAuth callback with code and state:", { code_length: code.length, state });
      
      handleCallback(code, state).then((success) => {
        if (success) {
          navigate("/google-business", { replace: true });
          toast.success("Google account connected successfully");
          
          setTimeout(() => {
            fetchProfile().catch(err => {
              console.error("Error refreshing profile after callback:", err);
            });
          }, 1000);
        } else {
          toast.error("Failed to connect Google account");
        }
      }).catch(err => {
        console.error("Error handling callback:", err);
        const errorMessage = err.message || "Unknown error";
        
        if (errorMessage.includes("refresh token")) {
          toast.error("Connexion impossible: Ce compte Google a déjà été utilisé. Veuillez déconnecter l'application dans les paramètres Google ou utiliser un autre compte.");
        } else if (errorMessage.includes("permission")) {
          toast.error("Connexion impossible: Votre compte Google n'a pas accès à Google My Business ou n'a pas de fiche.");
        } else if (errorMessage.includes("Invalid OAuth state")) {
          toast.error("Session d'authentification expirée. Veuillez réessayer la connexion.");
        } else {
          toast.error("Erreur de connexion à Google: " + errorMessage);
        }
      }).finally(() => {
        setIsCallbackProcessing(false);
      });
    }
  }, [searchParams, handleCallback, navigate, fetchProfile, isCallbackProcessing]);
  
  useEffect(() => {
    if (noLocationsFound && (activeTab === "accounts" || activeTab === "locations")) {
      setShowNoLocationsDialog(true);
    }
  }, [noLocationsFound, activeTab]);
  
  useEffect(() => {
    if (error) {
      setConnectionError(error);
    }
  }, [error]);
  
  const handleConnect = async () => {
    setConnectionError(null);
    try {
      const authUrl = await getAuthUrl();
      console.log("Authentication URL obtained:", authUrl);
      
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("Unable to get authentication URL");
      }
    } catch (err: any) {
      console.error("Error connecting:", err);
      setConnectionError(`Error connecting to Google: ${err.message}`);
      toast.error("Error connecting to Google");
    }
  };
  
  const handleLoadAccounts = async () => {
    setConnectionError(null);
    try {
      await listAccounts();
      setActiveTab("accounts");
    } catch (err: any) {
      setConnectionError(`Failed to load accounts: ${err.message}`);
    }
  };
  
  const handleSelectAccount = async (accountId: string) => {
    setConnectionError(null);
    try {
      setSelectedAccountId(accountId);
      await listLocations(accountId);
      setActiveTab("locations");
    } catch (err: any) {
      setConnectionError(`Failed to load locations: ${err.message}`);
    }
  };
  
  const handleSelectLocation = async (locationId: string) => {
    if (!selectedAccountId) return;
    
    setConnectionError(null);
    try {
      const success = await saveLocation(selectedAccountId, locationId);
      if (success) {
        setActiveTab("profile");
      }
    } catch (err: any) {
      setConnectionError(`Failed to select location: ${err.message}`);
    }
  };
  
  const handleDisconnect = async () => {
    setConnectionError(null);
    try {
      const success = await disconnect();
      if (success) {
        setActiveTab("profile");
      }
    } catch (err: any) {
      setConnectionError(`Failed to disconnect: ${err.message}`);
    }
  };
  
  const isProcessingCallback = (searchParams.get("code") && searchParams.get("state")) || isCallbackProcessing;
  const hasOAuthError = searchParams.get("error") || searchParams.get("error_code");
  
  if (!user && !isProcessingCallback && !hasOAuthError) return null;
  
  return (
    <PageLayout title="Google My Business">
      <div className="container max-w-6xl mx-auto py-6">
        <AnimatedContainer>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Google My Business Management</h1>
            <p className="text-muted-foreground">
              Connect your Google My Business listing to manage it directly from the application.
            </p>
          </div>
          
          {connectionError && (
            <Card className="bg-red-50 border-red-200 mb-4">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Error Detected</h3>
                    <p>{connectionError}</p>
                    
                    {connectionError.includes("expired") || 
                     connectionError.includes("state") || 
                     connectionError.includes("OAuth") ? (
                      <div className="mt-3 space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleConnect}
                          className="mr-2">
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Try connecting again
                        </Button>
                        
                        {showOAuthErrorDetails && (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details">
                              <AccordionTrigger className="py-2 text-xs">
                                <span className="flex items-center gap-1">
                                  <Info className="h-3.5 w-3.5" />
                                  Technical details
                                </span>
                              </AccordionTrigger>
                              <AccordionContent className="text-xs">
                                <div className="bg-slate-100 p-2 rounded text-slate-700">
                                  <p>Error info: {searchParams.get("error") || searchParams.get("error_code")}</p>
                                  <p>Description: {searchParams.get("error_description") || "No details available"}</p>
                                  <p>Current state: {debugInfo.storedState || "None"}</p>
                                  <p>Received state: {debugInfo.receivedState || "None"}</p>
                                  <p>State valid: {debugInfo.stateValid !== undefined ? String(debugInfo.stateValid) : "Unknown"}</p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {authInProgress && !isCallbackProcessing && (
            <Card className="mb-4 shadow-md bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <LoadingIndicator variant="dots" size={24} />
                  <div>
                    <h3 className="font-medium">Authentication in Progress</h3>
                    <p className="text-muted-foreground">We're waiting for you to complete the Google authentication. Please complete the process in the Google authorization window.</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      localStorage.removeItem('gmb_oauth_state');
                      window.location.reload();
                    }}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                    Cancel authentication
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isCallbackProcessing && (
            <Card className="mb-4 shadow-md bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <LoadingIndicator variant="dots" size={24} />
                  <div>
                    <h3 className="font-medium">Google Account Authentication</h3>
                    <p className="text-muted-foreground">Processing your Google account authentication. Please wait...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {process.env.NODE_ENV !== 'production' && (
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="debug-info">
                <AccordionTrigger className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  <span>Debug Information</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-slate-50 p-4 rounded-md text-xs font-mono overflow-auto max-h-80">
                    <h3 className="text-sm font-semibold mb-2">Auth Status</h3>
                    <p>User Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p>User ID: {user?.id || 'Not logged in'}</p>
                    
                    <h3 className="text-sm font-semibold mt-4 mb-2">Google Connection</h3>
                    <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
                    <p>Has Profile: {profile ? 'Yes' : 'No'}</p>
                    <p>Google Email: {profile?.googleEmail || 'None'}</p>
                    
                    <h3 className="text-sm font-semibold mt-4 mb-2">Callback Processing</h3>
                    <p>State: {searchParams.get("state") || 'None'}</p>
                    <p>Code Present: {searchParams.get("code") ? 'Yes' : 'No'}</p>
                    <p>Currently Processing: {isCallbackProcessing ? 'Yes' : 'No'}</p>
                    <p>Already Processed: {callbackProcessed ? 'Yes' : 'No'}</p>
                    
                    <h3 className="text-sm font-semibold mt-4 mb-2">API Calls</h3>
                    <details open>
                      <summary>Last API Call: {debugInfo.lastApiCall}</summary>
                      <pre className="bg-slate-100 p-2 rounded mt-2">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          fetchProfile();
                          toast.info("Profile refreshed");
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Refresh Profile
                      </Button>
                      
                      {isConnected && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            listAccounts();
                            toast.info("Accounts refreshed");
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Refresh Accounts
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {isLoading && !profile && !isCallbackProcessing ? (
            <Card className="shadow-md">
              <CardContent className="pt-6 flex justify-center items-center h-40">
                <LoadingIndicator variant="dots" size={40} />
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="accounts" disabled={!isConnected}>Accounts</TabsTrigger>
                <TabsTrigger value="locations" disabled={!selectedAccountId}>Locations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Connection Status
                    </CardTitle>
                    <CardDescription>
                      Manage your connection with your Google My Business account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isConnected && profile ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Google account connected</span>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm font-medium">Google Email</p>
                          <p className="text-muted-foreground">{profile.googleEmail || 'Not specified'}</p>
                        </div>
                        
                        {profile.gmb_account_id && profile.gmb_location_id ? (
                          <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm font-medium">Selected Location</p>
                            <p className="text-muted-foreground">
                              Account ID: {profile.gmb_account_id}
                            </p>
                            <p className="text-muted-foreground">
                              Location ID: {profile.gmb_location_id}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">No location selected</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Google account not connected</span>
                        </div>
                        
                        <p className="text-muted-foreground">
                          Connect your Google My Business account to manage your business listing 
                          directly from the application.
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col space-y-2 items-start">
                    {isConnected ? (
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleLoadAccounts} className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {profile?.gmb_account_id 
                            ? "Change location" 
                            : "Select a location"}
                        </Button>
                        <Button variant="outline" onClick={handleDisconnect} className="flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleConnect} className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Connect to Google My Business
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="accounts">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Google My Business Accounts
                    </CardTitle>
                    <CardDescription>
                      Select an account to view its locations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <LoadingIndicator variant="dots" size={40} />
                      </div>
                    ) : accounts.length > 0 ? (
                      <div className="space-y-4">
                        {accounts.map((account, index) => (
                          <div key={index} className="border rounded-md shadow-sm">
                            <div className="p-4">
                              <h3 className="font-medium">{account.accountName}</h3>
                              <p className="text-sm text-muted-foreground">
                                {account.name}
                              </p>
                            </div>
                            <Separator />
                            <div className="p-4 flex justify-end">
                              <Button 
                                onClick={() => handleSelectAccount(account.name)}
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                View locations
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          No Google My Business accounts found.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 flex items-center gap-2"
                          onClick={() => listAccounts()}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("profile")}
                      className="mr-auto"
                    >
                      Back
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="locations">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Locations
                    </CardTitle>
                    <CardDescription>
                      Select the location you want to manage.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <LoadingIndicator variant="dots" size={40} />
                      </div>
                    ) : locations.length > 0 ? (
                      <div className="space-y-4">
                        {locations.map((location, index) => (
                          <div key={index} className="border rounded-md shadow-sm">
                            <div className="p-4">
                              <h3 className="font-medium">{location.title || location.locationName}</h3>
                              {location.address && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {location.address.addressLines?.join(', ')}, {location.address.locality}, {location.address.postalCode}
                                </p>
                              )}
                            </div>
                            <Separator />
                            <div className="p-4 flex justify-end">
                              <Button 
                                onClick={() => handleSelectLocation(location.name)}
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                Select
                                <CheckCircle className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          No locations found for this account.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 flex items-center gap-2"
                          onClick={() => selectedAccountId && listLocations(selectedAccountId)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("accounts")}
                      className="mr-auto"
                    >
                      Back
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Need help setting up your Google My Business listing? 
              <a 
                href="https://support.google.com/business/answer/9798848" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary ml-1 flex items-center gap-1 inline-flex"
              >
                View Google documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </AnimatedContainer>
      </div>

      <Dialog open={showNoLocationsDialog} onOpenChange={setShowNoLocationsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Aucune fiche n'a été trouvée</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-slate-100">
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-semibold">{profile?.googleEmail || "Votre compte Google"}</p>
              <Button variant="link" onClick={handleDisconnect} className="text-blue-500">
                Déconnectez-vous et connectez un autre compte
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="text-center">
              <p className="text-base mb-6">
                Il n'y a pas de fiches qui soient gérées par votre compte. Essayez un autre 
                compte en vous déconnectant, ou nous pouvons vous aider à créer votre 
                profil d'entreprise.
              </p>
              <Button 
                className="w-full"
                onClick={() => {
                  setShowNoLocationsDialog(false);
                  window.open("https://business.google.com/create", "_blank");
                }}
              >
                Créer un Profil d'Établissement Google
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default GoogleBusinessPage;
