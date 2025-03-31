
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, ExternalLink, HelpCircle } from "lucide-react";
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
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [showHelp, setShowHelp] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
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
      setLastChecked(new Date());
    }
  }, [configId, status]);

  const handleSync = async () => {
    try {
      const effectiveConfigId = configId || user?.wordpressConfigId;
      
      if (!effectiveConfigId) {
        toast.error("Aucune configuration WordPress associée");
        return;
      }
      
      const result = await checkConnection(effectiveConfigId);
      setLastChecked(new Date());
      
      if (result.success) {
        toast.success("Connexion WordPress établie avec succès");
        // Actualiser les catégories et les pages
        await Promise.all([refetchCategories(), refetchPages()]);
        toast.success("Données WordPress synchronisées avec succès");
      } else {
        toast.error(`Échec de connexion: ${result.message}`);
        
        // Si on a un message d'erreur détaillé, afficher l'aide
        if (result.message?.includes("Erreur réseau") || result.message?.includes("impossible d'accéder")) {
          setShowHelp(true);
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

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
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
            {lastChecked && (
              <p className="text-xs text-muted-foreground mt-1">
                Dernière vérification: {formatTime(lastChecked)}
              </p>
            )}
            {errorDetails && (
              <p className="text-xs text-red-500 mt-1">{errorDetails}</p>
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

      {status === "disconnected" && errorDetails && (
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 h-8"
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              <span>Aide</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dépannage de la connexion WordPress</DialogTitle>
              <DialogDescription>
                Voici quelques informations qui peuvent vous aider à résoudre les problèmes de connexion à WordPress.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="diagnostic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
                <TabsTrigger value="solutions">Solutions</TabsTrigger>
                <TabsTrigger value="tools">Outils</TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagnostic" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Problème détecté:</h4>
                  <p className="text-red-500">{errorDetails}</p>
                  
                  <h4 className="font-medium mt-4 mb-2">URL WordPress:</h4>
                  <p className="break-all">{configDetails.site_url}</p>
                  
                  <h4 className="font-medium mt-4 mb-2">Causes possibles:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Le site WordPress n'est pas accessible depuis notre serveur</li>
                    <li>L'URL est incorrecte</li>
                    <li>Le site WordPress a des restrictions CORS</li>
                    <li>L'API REST WordPress n'est pas activée</li>
                    <li>Authentification incorrecte ou insuffisante</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="solutions" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Vérifications à faire:</h4>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong>Vérifiez l'accessibilité du site:</strong> Ouvrez l'URL WordPress dans un 
                      navigateur pour confirmer qu'elle est accessible.
                    </li>
                    <li>
                      <strong>Vérifiez l'URL:</strong> Assurez-vous que l'URL est correcte et se termine 
                      par un slash (/) si nécessaire.
                    </li>
                    <li>
                      <strong>Vérifiez l'API REST:</strong> Essayez d'accéder à <code>{configDetails.site_url}/wp-json</code> 
                      dans votre navigateur pour vérifier que l'API REST WordPress est active.
                    </li>
                    <li>
                      <strong>Vérifiez les identifiants:</strong> Assurez-vous que les identifiants de l'API REST ou 
                      les mots de passe d'application sont corrects.
                    </li>
                    <li>
                      <strong>Vérifiez la configuration CORS:</strong> Vous pourriez avoir besoin d'installer un plugin 
                      WordPress qui active CORS pour l'API REST.
                    </li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="space-y-4 mt-4">
                <div>
                  <h4 className="font-medium mb-2">Testez l'URL manuellement:</h4>
                  <p className="mb-2">Ouvrez ces URL dans un nouvel onglet pour vérifier l'accès:</p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Site WordPress:</p>
                      <a 
                        href={configDetails.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center text-sm"
                      >
                        {configDetails.site_url}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">API REST WordPress:</p>
                      <a 
                        href={`${configDetails.site_url}/wp-json`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center text-sm"
                      >
                        {configDetails.site_url}/wp-json
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Catégories WordPress:</p>
                      <a 
                        href={`${configDetails.site_url}/wp-json/wp/v2/categories`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center text-sm"
                      >
                        {configDetails.site_url}/wp-json/wp/v2/categories
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Fermer
                </Button>
              </DialogClose>
              <Button onClick={handleSync}>
                Réessayer
              </Button>
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
