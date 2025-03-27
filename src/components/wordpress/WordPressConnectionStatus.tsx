
import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWordPressConnection } from "@/hooks/wordpress/useWordPressConnection";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, ExternalLink } from "lucide-react";
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const { status, isChecking, checkConnection, error: connectionError } = useWordPressConnection();
  const [configDetails, setConfigDetails] = useState<{name?: string, site_url?: string}>({});
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
    if (status === "unknown" && (configId || user?.wordpressConfigId)) {
      checkConnection(configId);
    }
  }, [configId, user?.wordpressConfigId, status]);

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
        // Afficher l'erreur détaillée
        setErrorDetails(result.message);
        toast.error(`Échec de connexion: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Sync error:", error);
      setErrorDetails(error.message || "Erreur inconnue");
      toast.error("Erreur lors de la synchronisation");
    }
  };

  const handleShowErrorDetails = () => {
    const errorToShow = connectionError || categoriesError || pagesError || "Pas de détails d'erreur disponibles";
    setErrorDetails(errorToShow);
    setShowErrorDialog(true);
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
        // Vérifier si nous avons réellement des données
        if (categoriesError || pagesError) {
          return (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>Connecté avec erreurs</span>
            </Badge>
          );
        }
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

  const isAnyError = connectionError || categoriesError || pagesError;

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
            {isAnyError && <p className="text-xs text-red-500 mt-1">Des erreurs sont présentes. Cliquez sur "Détails" pour plus d'informations.</p>}
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

      {isAnyError && (
        <Button 
          variant="outline" 
          size="sm"
          className="px-2 h-8 text-red-500 hover:text-red-700"
          onClick={handleShowErrorDetails}
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          Détails
        </Button>
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
                  {categoriesError && <div>Erreur catégories: {categoriesError}</div>}
                  {pagesError && <div>Erreur pages: {pagesError}</div>}
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
                        className="text-xs text-blue-500 hover:underline flex items-center"
                      >
                        {configDetails.site_url}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de l'erreur</DialogTitle>
            <DialogDescription>
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800 whitespace-pre-wrap">
                {errorDetails}
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Solutions possibles:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Vérifiez que l'URL du site WordPress est correcte</li>
                  <li>Assurez-vous que votre nom d'utilisateur et mot de passe WordPress sont valides</li>
                  <li>Vérifiez que votre site WordPress est accessible depuis l'extérieur</li>
                  <li>Assurez-vous que l'API REST de WordPress est activée</li>
                  <li>Si vous utilisez un pare-feu ou WAF, vérifiez qu'il n'y a pas de restrictions CORS</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WordPressConnectionStatus;
