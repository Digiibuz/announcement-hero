
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useWordPressPages } from "@/hooks/wordpress/useWordPressPages";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { toast } from "sonner";

interface WordPressConnectionStatusProps {
  siteUrl: string;
  wordpressConfigId?: string;
}

const WordPressConnectionStatus = ({ siteUrl, wordpressConfigId }: WordPressConnectionStatusProps) => {
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { 
    pages, 
    isLoading: isPagesLoading, 
    error: pagesError, 
    refetch: refetchPages,
    hasPages
  } = useWordPressPages();
  
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    error: categoriesError, 
    fetchCategories,
    hasCategories = categories.length > 0 
  } = useWordPressCategories(wordpressConfigId);
  
  const isLoading = isPagesLoading || isCategoriesLoading || isManualChecking;
  const hasError = !!pagesError || !!categoriesError;
  
  // Statut global de la connexion
  const connectionStatus = 
    isLoading ? "loading" :
    hasError ? "error" :
    (hasPages && hasCategories) ? "success" :
    "warning";
  
  const statusColors = {
    loading: "text-blue-500 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
    error: "text-destructive bg-destructive/10",
    success: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400",
    warning: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400"
  };
  
  const statusMessages = {
    loading: "Vérification de la connexion...",
    error: "Erreur de connexion",
    success: "Connexion établie",
    warning: "Connexion partielle"
  };
  
  const statusIcons = {
    loading: <Loader2 className="h-4 w-4 mr-2 animate-spin" />,
    error: <AlertCircle className="h-4 w-4 mr-2" />,
    success: <CheckCircle2 className="h-4 w-4 mr-2" />,
    warning: <AlertCircle className="h-4 w-4 mr-2" />
  };
  
  const handleCheckConnection = async () => {
    setIsManualChecking(true);
    try {
      // Vérifier les connexions WordPress
      await refetchPages();
      await fetchCategories();
      
      // Afficher une notification de succès
      toast.success("Vérification de la connexion terminée");
    } catch (error) {
      console.error("Erreur lors de la vérification de la connexion:", error);
      toast.error("Erreur lors de la vérification de la connexion");
    } finally {
      setIsManualChecking(false);
    }
  };
  
  const truncateUrl = (url: string) => {
    if (url.length > 30) {
      return url.substring(0, 30) + "...";
    }
    return url;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex justify-between items-center">
            <span>Statut de la connexion WordPress</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2"
              onClick={handleCheckConnection}
              disabled={isLoading}
            >
              {isManualChecking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-2">
            <div
              className={`p-2 rounded-md flex items-center text-sm ${statusColors[connectionStatus]}`}
            >
              {statusIcons[connectionStatus]}
              <span className="font-medium">{statusMessages[connectionStatus]}</span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Site URL:</span> {truncateUrl(siteUrl)}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={() => setIsDialogOpen(true)}
            disabled={isLoading}
          >
            Voir les détails
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Statut de la connexion WordPress</DialogTitle>
            <DialogDescription>
              Détails de la connexion à votre site WordPress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">URL du site</span>
              <span className="text-sm">{siteUrl}</span>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium px-1">Statut des connexions</h4>
              
              {/* Statut des pages */}
              <div className="bg-muted p-2 rounded-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">Pages WordPress</span>
                  {isPagesLoading ? (
                    <span className="flex items-center text-blue-500">
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Vérification...
                    </span>
                  ) : pagesError ? (
                    <span className="flex items-center text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Erreur
                    </span>
                  ) : hasPages ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Connecté
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Aucune page
                    </span>
                  )}
                </div>
                
                {pagesError && (
                  <div className="text-xs text-muted-foreground bg-card p-1.5 rounded-sm">
                    {typeof pagesError === 'string' ? pagesError : pagesError.message}
                  </div>
                )}
              </div>
              
              {/* Statut des catégories */}
              <div className="bg-muted p-2 rounded-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">Catégories (DipiPixel)</span>
                  {isCategoriesLoading ? (
                    <span className="flex items-center text-blue-500">
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Vérification...
                    </span>
                  ) : categoriesError ? (
                    <span className="flex items-center text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Erreur
                    </span>
                  ) : hasCategories ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Connecté
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Aucune catégorie
                    </span>
                  )}
                </div>
                
                {categoriesError && (
                  <div className="text-xs text-muted-foreground bg-card p-1.5 rounded-sm">
                    {categoriesError.message}
                  </div>
                )}
              </div>
            </div>
            
            {/* Message d'aide */}
            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Problème de connexion</AlertTitle>
                <AlertDescription>
                  Votre site WordPress n'est pas correctement configuré ou il y a un problème d'authentification. Vérifiez vos identifiants et paramètres API.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Fermer
            </Button>
            <Button 
              onClick={handleCheckConnection} 
              disabled={isLoading}
            >
              {isManualChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Vérifier à nouveau
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WordPressConnectionStatus;
