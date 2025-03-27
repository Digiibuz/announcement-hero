
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, HelpCircle, Globe, ShieldCheck, Network, ServerOff } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WordPressConnectionStatusProps {
  configId?: string;
  showDetails?: boolean;
  className?: string;
}

const WordPressConnectionStatus: React.FC<WordPressConnectionStatusProps> = ({
  configId,
  showDetails = false,
  className
}) => {
  const { user } = useAuth();
  const { status, isChecking, errorDetails, checkConnection } = useWordPressConnection();
  const [configDetails, setConfigDetails] = useState<{name?: string, site_url?: string}>({});
  const [showTroubleshootDialog, setShowTroubleshootDialog] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    refetch: refetchCategories,
    hasCategories,
    error: categoriesError
  } = useWordPressCategories();
  
  const { 
    pages, 
    isLoading: isPagesLoading, 
    refetch: refetchPages,
    hasPages,
    error: pagesError
  } = useWordPressPages();

  useEffect(() => {
    // Fetch WordPress config details for additional info
    const fetchConfigDetails = async () => {
      const id = configId || user?.wordpressConfigId;
      if (id) {
        try {
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('name, site_url')
            .eq('id', id)
            .single();
          
          if (!error && data) {
            setConfigDetails(data);
          }
        } catch (err) {
          console.error("Error fetching WordPress config details:", err);
        }
      }
    };
    
    fetchConfigDetails();
  }, [configId, user?.wordpressConfigId]);

  // Vérifier la connexion au chargement du composant
  useEffect(() => {
    if (status === "unknown" && configId) {
      checkConnection(configId);
    }
  }, [configId, status]);

  const handleSync = async () => {
    try {
      const effectiveConfigId = configId || user?.wordpressConfigId;
      
      if (!effectiveConfigId) {
        toast.error("Aucune configuration WordPress associée");
        return;
      }
      
      setLastCheckTime(new Date());
      const result = await checkConnection(effectiveConfigId);
      
      if (result.success) {
        toast.success("Connexion WordPress établie avec succès");
        // Actualiser les catégories et les pages
        await Promise.all([refetchCategories(), refetchPages()]);
        toast.success("Données WordPress synchronisées avec succès");
      } else {
        toast.error(`Échec de connexion: ${result.message}`);
        
        // Si c'est une erreur réseau, afficher le dialog de dépannage
        if (result.message.includes("réseau") || result.message.includes("Failed to fetch")) {
          setShowTroubleshootDialog(true);
        }
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erreur lors de la synchronisation");
    }
  };

  const getStatusContent = () => {
    if (isChecking) {
      return (
        <Badge variant="outline" className="bg-slate-100">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          <span>Vérification...</span>
        </Badge>
      );
    }

    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Connecté</span>
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            <span>Déconnecté</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Statut inconnu</span>
          </Badge>
        );
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              {getStatusContent()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>État de la connexion WordPress{configDetails.name ? ` (${configDetails.name})` : ''}</p>
            {errorDetails && (
              <p className="text-xs text-red-500 mt-1">{errorDetails}</p>
            )}
            {lastCheckTime && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernière vérification: {lastCheckTime.toLocaleTimeString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleSync}
        disabled={isChecking || isCategoriesLoading || isPagesLoading}
        className="px-2 h-8"
      >
        {(isChecking || isCategoriesLoading || isPagesLoading) ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        <span className="ml-1">Synchroniser</span>
      </Button>

      {errorDetails && (
        <Dialog open={showTroubleshootDialog} onOpenChange={setShowTroubleshootDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dépannage de la connexion WordPress</DialogTitle>
              <DialogDescription>
                Voici quelques solutions aux problèmes de connexion WordPress courants.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="issues">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="issues">Diagnostic</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
                <TabsTrigger value="tools">Outils</TabsTrigger>
              </TabsList>
              
              <TabsContent value="issues">
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="font-medium flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                      Erreur détectée: {errorDetails}
                    </h3>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <ServerOff className="h-4 w-4 mr-2" />
                        Diagnostic du problème
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Erreur de type "Failed to fetch" ou "Erreur réseau"</h4>
                        <p className="text-sm text-muted-foreground">
                          Cette erreur indique généralement un des problèmes suivants:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Problème de connexion internet</li>
                          <li>Restrictions CORS (Cross-Origin Resource Sharing)</li>
                          <li>Le site WordPress est inaccessible ou l'URL est incorrecte</li>
                          <li>Un pare-feu bloque les requêtes</li>
                          <li>L'API REST de WordPress n'est pas activée</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="solutions">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Étapes de résolution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>
                          <strong>Vérifiez l'URL du site WordPress</strong>
                          <p className="text-muted-foreground">
                            Assurez-vous que l'URL est correcte et accessible depuis votre navigateur.
                            <br />URL actuelle: <code className="bg-muted p-1 rounded">{configDetails.site_url}</code>
                          </p>
                        </li>
                        <li>
                          <strong>Vérifiez que l'API REST WordPress est activée</strong>
                          <p className="text-muted-foreground">
                            Dans l'admin WordPress: Réglages → Permaliens → Vérifiez que les permaliens ne sont pas réglés sur "Simple".
                          </p>
                        </li>
                        <li>
                          <strong>Configuration CORS</strong>
                          <p className="text-muted-foreground">
                            Installez et configurez un plugin CORS sur votre site WordPress:
                            <br />- Plugin recommandé: "WP CORS" ou "Enable CORS"
                            <br />- Ajoutez cette application (<code className="bg-muted p-1 rounded">{window.location.origin}</code>) aux domaines autorisés
                          </p>
                        </li>
                        <li>
                          <strong>Vérifiez les identifiants WordPress</strong>
                          <p className="text-muted-foreground">
                            Assurez-vous que les identifiants de l'Application Password sont corrects.
                          </p>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="tools">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <Network className="h-4 w-4 mr-2" />
                        Tests de connectivité
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {configDetails.site_url && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">URLs à tester dans votre navigateur:</h4>
                          
                          <div className="space-y-1">
                            <p className="text-xs">Site principal:</p>
                            <code className="bg-muted p-2 rounded text-xs block truncate">
                              {configDetails.site_url.replace(/\/$/, '')}
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs">Point d'entrée API REST:</p>
                            <code className="bg-muted p-2 rounded text-xs block truncate">
                              {configDetails.site_url.replace(/\/$/, '')}/wp-json
                            </code>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs">API Catégories:</p>
                            <code className="bg-muted p-2 rounded text-xs block truncate">
                              {configDetails.site_url.replace(/\/$/, '')}/wp-json/wp/v2/categories
                            </code>
                          </div>
                          
                          <p className="text-sm mt-4">
                            Si vous pouvez accéder à ces URLs dans votre navigateur mais pas depuis cette application,
                            c'est très probablement un problème de CORS.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Configuration de sécurité WordPress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">Plugins recommandés pour résoudre les problèmes CORS:</p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>WP CORS</li>
                        <li>Enable CORS</li>
                        <li>CORS Enabler</li>
                      </ul>
                      
                      <p className="text-sm mt-4">
                        Si vous utilisez un pare-feu comme Wordfence, vérifiez qu'il n'est pas configuré pour bloquer les
                        requêtes API.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex justify-between items-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => window.open(configDetails.site_url, '_blank')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Visiter le site
              </Button>
              
              <div className="flex space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Fermer</Button>
                </DialogClose>
                <Button onClick={handleSync}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {showDetails && status === "connected" && (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
              Détails
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Données WordPress</h4>
              {categoriesError || pagesError ? (
                <div className="text-xs text-red-500">
                  {categoriesError || pagesError}
                </div>
              ) : (
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Catégories:</span>
                    <Badge variant={hasCategories ? "secondary" : "outline"}>
                      {hasCategories ? categories.length : 'Aucune'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <Badge variant={hasPages ? "secondary" : "outline"}>
                      {hasPages ? pages.length : 'Aucune'}
                    </Badge>
                  </div>
                  {configDetails.site_url && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <a 
                        href={configDetails.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {configDetails.site_url}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
};

export default WordPressConnectionStatus;
