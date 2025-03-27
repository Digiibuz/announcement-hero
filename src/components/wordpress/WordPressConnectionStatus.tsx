
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, HelpCircle } from "lucide-react";
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
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Dépannage de la connexion WordPress</DialogTitle>
              <DialogDescription>
                Voici quelques solutions aux problèmes de connexion WordPress courants.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 my-4">
              <h3 className="font-medium">Erreur détectée: {errorDetails}</h3>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Solutions possibles:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Vérifiez que l'URL du site est correcte et accessible depuis l'extérieur</li>
                  <li>Assurez-vous que l'API REST WordPress est activée sur votre site</li>
                  <li>Vérifiez que vos identifiants WordPress sont corrects</li>
                  <li>Vérifiez que le site WordPress n'est pas bloqué par un pare-feu</li>
                  <li>Assurez-vous que la configuration CORS permet les requêtes depuis cette application</li>
                  <li>Si vous utilisez un certificat SSL, vérifiez qu'il est valide et à jour</li>
                </ul>
              </div>
              
              {configDetails.site_url && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Tests à effectuer:</h4>
                  <p className="text-sm">Vérifiez si l'API REST WordPress est accessible en ouvrant cette URL dans votre navigateur:</p>
                  <code className="bg-muted p-2 rounded text-xs block">
                    {configDetails.site_url.replace(/\/$/, '')}/wp-json
                  </code>
                  <p className="text-sm mt-2">Vous devriez voir une réponse JSON si l'API est active.</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fermer</Button>
              </DialogClose>
              <Button onClick={handleSync}>
                Réessayer la connexion
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
