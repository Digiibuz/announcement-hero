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
  RefreshCw, CheckCircle, ExternalLink, AlertCircle, Bug 
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

const GoogleBusinessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { 
    isLoading, isConnected, profile, accounts, locations, error,
    fetchProfile, getAuthUrl, handleCallback,
    listAccounts, listLocations, saveLocation, disconnect,
    debugInfo, callbackProcessed
  } = useGoogleBusiness();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCallbackProcessing, setIsCallbackProcessing] = useState(false);
  
  // Enhanced authentication check
  useEffect(() => {
    console.log("Auth status check: isAuthenticated =", isAuthenticated);
    if (!isAuthenticated) {
      // Only redirect if we're not processing a callback
      if (!searchParams.get("code")) {
        console.log("User not authenticated, redirecting to login");
        toast.error("You need to log in to access Google Business features");
        navigate("/login", { state: { returnUrl: "/google-business" } });
      } else {
        console.log("Not redirecting because we're processing a callback");
      }
    }
  }, [isAuthenticated, navigate, searchParams]);
  
  // Initialize GMB profile with better error handling
  useEffect(() => {
    const initProfile = async () => {
      try {
        console.log("Initializing Google Business profile");
        const profile = await fetchProfile();
        console.log("Profile initialization result:", profile);
        
        if (profile?.gmb_account_id) {
          setSelectedAccountId(profile.gmb_account_id);
        }
      } catch (err: any) {
        console.error("Error initializing profile:", err);
        setConnectionError(`Error initializing profile: ${err.message}`);
      }
    };
    
    // Only init profile if user is authenticated and not processing callback
    if (isAuthenticated && !isCallbackProcessing) {
      console.log("User is authenticated, initializing profile");
      initProfile();
    } else {
      console.log("Skipping profile initialization: authenticated=", isAuthenticated, "callbackProcessing=", isCallbackProcessing);
    }
  }, [fetchProfile, isAuthenticated, isCallbackProcessing]);
  
  // Process OAuth callback with better logging
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (code && state && !isCallbackProcessing) {
      console.log("OAuth callback detected with code and state");
      setIsCallbackProcessing(true);
      
      // Get a session first to ensure we're authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.error("No session found during callback processing");
          toast.error("Authentication required. Please log in first.");
          navigate("/login", { state: { returnUrl: "/google-business" } });
          setIsCallbackProcessing(false);
          return;
        }
        
        console.log("Session found, processing callback");
        handleCallback(code, state).then((success) => {
          if (success) {
            // Remove URL parameters
            navigate("/google-business", { replace: true });
            toast.success("Google account connected successfully");
            
            // Refresh the profile after a short delay
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
          toast.error("Error connecting to Google: " + (err.message || "Unknown error"));
        }).finally(() => {
          setIsCallbackProcessing(false);
        });
      });
    }
  }, [searchParams, handleCallback, navigate, fetchProfile, isCallbackProcessing]);

  // Update local error state when the hook error changes
  useEffect(() => {
    if (error) {
      setConnectionError(error);
    }
  }, [error]);
  
  // Connect to Google
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
  
  // Load GMB accounts
  const handleLoadAccounts = async () => {
    setConnectionError(null);
    try {
      await listAccounts();
      setActiveTab("accounts");
    } catch (err: any) {
      setConnectionError(`Failed to load accounts: ${err.message}`);
    }
  };
  
  // Load locations for a GMB account
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
  
  // Select a location
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
  
  // Disconnect from Google
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
  
  // Special case: If we're processing a callback, show a loading state
  // even if the user isn't fully authenticated yet
  const isProcessingCallback = searchParams.get("code") && searchParams.get("state");
  
  if (!isAuthenticated && !isCallbackProcessing) {
    // Don't render full component if not authenticated
    return null;
  }
  
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
                  </div>
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
          
          {/* Debugging information */}
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
                      <summary>Last API Call</summary>
                      <pre className="bg-slate-100 p-2 rounded mt-2">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        fetchProfile();
                        toast.info("Profile refreshed");
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Refresh Profile
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Show loading indicator if we're waiting for auth or profile, and not processing callback */}
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
              
              {/* Profile Tab */}
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
              
              {/* Accounts Tab */}
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
              
              {/* Locations Tab */}
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
    </PageLayout>
  );
};

export default GoogleBusinessPage;
