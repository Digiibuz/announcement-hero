
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
  RefreshCw, CheckCircle, ExternalLink, AlertCircle 
} from "lucide-react";
import { toast } from "sonner";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const GoogleBusinessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const { 
    isLoading, isConnected, profile, accounts, locations,
    fetchProfile, getAuthUrl, handleCallback,
    listAccounts, listLocations, saveLocation, disconnect
  } = useGoogleBusiness();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  // Initialiser le profil GMB
  useEffect(() => {
    const initProfile = async () => {
      const profile = await fetchProfile();
      if (profile?.gmb_account_id) {
        setSelectedAccountId(profile.gmb_account_id);
      }
    };
    
    initProfile();
  }, [fetchProfile]);
  
  // Traiter le callback OAuth
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (code && state) {
      handleCallback(code, state).then((success) => {
        if (success) {
          // Supprimer les paramètres de l'URL
          navigate("/google-business", { replace: true });
        }
      });
    }
  }, [searchParams, handleCallback, navigate]);
  
  // Se connecter à Google
  const handleConnect = async () => {
    const authUrl = await getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };
  
  // Charger les comptes GMB
  const handleLoadAccounts = async () => {
    await listAccounts();
    setActiveTab("accounts");
  };
  
  // Charger les établissements d'un compte GMB
  const handleSelectAccount = async (accountId: string) => {
    setSelectedAccountId(accountId);
    await listLocations(accountId);
    setActiveTab("locations");
  };
  
  // Sélectionner un établissement
  const handleSelectLocation = async (locationId: string) => {
    if (!selectedAccountId) return;
    
    const success = await saveLocation(selectedAccountId, locationId);
    if (success) {
      setActiveTab("profile");
    }
  };
  
  // Se déconnecter de Google
  const handleDisconnect = async () => {
    const success = await disconnect();
    if (success) {
      setActiveTab("profile");
    }
  };
  
  if (!user) return null;
  
  return (
    <PageLayout title="Google My Business">
      <div className="container max-w-6xl mx-auto py-6">
        <AnimatedContainer>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestion Google My Business</h1>
            <p className="text-muted-foreground">
              Connectez votre fiche d'établissement Google My Business pour la gérer directement depuis l'application.
            </p>
          </div>
          
          {isLoading && !profile ? (
            <Card className="shadow-md">
              <CardContent className="pt-6 flex justify-center items-center h-40">
                <LoadingIndicator variant="dots" size={40} />
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full max-w-md">
                <TabsTrigger value="profile">Profil</TabsTrigger>
                <TabsTrigger value="accounts" disabled={!isConnected}>Comptes</TabsTrigger>
                <TabsTrigger value="locations" disabled={!selectedAccountId}>Établissements</TabsTrigger>
              </TabsList>
              
              {/* Onglet Profil */}
              <TabsContent value="profile">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Statut de connexion
                    </CardTitle>
                    <CardDescription>
                      Gérez la connexion avec votre compte Google My Business.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isConnected && profile ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Compte Google connecté</span>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-md">
                          <p className="text-sm font-medium">Email Google</p>
                          <p className="text-muted-foreground">{profile.googleEmail || 'Non spécifié'}</p>
                        </div>
                        
                        {profile.gmb_account_id && profile.gmb_location_id ? (
                          <div className="bg-muted p-4 rounded-md">
                            <p className="text-sm font-medium">Établissement sélectionné</p>
                            <p className="text-muted-foreground">
                              ID du compte: {profile.gmb_account_id}
                            </p>
                            <p className="text-muted-foreground">
                              ID de l'établissement: {profile.gmb_location_id}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Aucun établissement sélectionné</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">Compte Google non connecté</span>
                        </div>
                        
                        <p className="text-muted-foreground">
                          Connectez votre compte Google My Business pour gérer votre fiche d'établissement 
                          directement depuis l'application.
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
                            ? "Changer d'établissement" 
                            : "Sélectionner un établissement"}
                        </Button>
                        <Button variant="outline" onClick={handleDisconnect} className="flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Déconnecter
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={handleConnect} className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Se connecter à Google My Business
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Onglet Comptes */}
              <TabsContent value="accounts">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Comptes Google My Business
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez un compte pour voir ses établissements.
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
                                Voir les établissements
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          Aucun compte Google My Business trouvé.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 flex items-center gap-2"
                          onClick={() => listAccounts()}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Actualiser
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
                      Retour
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Onglet Établissements */}
              <TabsContent value="locations">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Établissements
                    </CardTitle>
                    <CardDescription>
                      Sélectionnez l'établissement que vous souhaitez gérer.
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
                                Sélectionner
                                <CheckCircle className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-muted-foreground">
                          Aucun établissement trouvé pour ce compte.
                        </p>
                        <Button 
                          variant="outline" 
                          className="mt-4 flex items-center gap-2"
                          onClick={() => selectedAccountId && listLocations(selectedAccountId)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Actualiser
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
                      Retour
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Besoin d'aide pour configurer votre fiche Google My Business ? 
              <a 
                href="https://support.google.com/business/answer/9798848" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary ml-1 flex items-center gap-1 inline-flex"
              >
                Voir la documentation Google
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
