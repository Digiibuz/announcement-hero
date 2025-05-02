
import React from "react";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface TroubleshootingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorDetails: string | null;
  configDetails: { name?: string; site_url?: string };
  onRetry: () => void;
}

const TroubleshootingDialog: React.FC<TroubleshootingDialogProps> = ({
  open,
  onOpenChange,
  errorDetails,
  configDetails,
  onRetry
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button onClick={onRetry}>
            Réessayer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TroubleshootingDialog;
