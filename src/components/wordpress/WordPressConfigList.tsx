
import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WordPressConfig } from "@/types/wordpress";
import { Loader2, Pencil, Trash2, Users } from "lucide-react";
import WordPressConfigForm from "./WordPressConfigForm";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import WordPressConnectionStatus from "./WordPressConnectionStatus";
import { useMediaQuery } from "@/hooks/use-media-query";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
  readOnly?: boolean; // Nouvelle prop pour indiquer le mode lecture seule
}

const WordPressConfigList: React.FC<WordPressConfigListProps> = ({
  configs,
  isLoading,
  isSubmitting,
  onUpdateConfig,
  onDeleteConfig,
  readOnly = false // Valeur par défaut à false
}) => {
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientUsers, setClientUsers] = useState<{[key: string]: UserProfile[]}>({});
  const [loadingUsers, setLoadingUsers] = useState<{[key: string]: boolean}>({});
  const [openCollapsibles, setOpenCollapsibles] = useState<{[key: string]: boolean}>({});
  const isMobile = useMediaQuery("(max-width: 640px)");

  const handleDeleteConfirm = async () => {
    if (!configToDelete) return;
    
    try {
      setIsDeleting(true);
      await onDeleteConfig(configToDelete);
    } catch (error) {
      console.error("Error deleting WordPress config:", error);
    } finally {
      setIsDeleting(false);
      setConfigToDelete(null);
    }
  };

  const fetchClientUsers = async (configId: string) => {
    try {
      setLoadingUsers(prev => ({ ...prev, [configId]: true }));
      
      // Fetch client users associated with this WordPress config
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wordpress_config_id', configId)
        .eq('role', 'client');
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Format client user data
      const formattedUsers: UserProfile[] = profilesData.map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: "client",
        clientId: profile.client_id,
        wordpressConfigId: profile.wordpress_config_id
      }));
      
      setClientUsers(prev => ({ ...prev, [configId]: formattedUsers }));
    } catch (error) {
      console.error("Error fetching client users for config:", error);
    } finally {
      setLoadingUsers(prev => ({ ...prev, [configId]: false }));
    }
  };

  const toggleCollapsible = (configId: string) => {
    const newState = !openCollapsibles[configId];
    setOpenCollapsibles(prev => ({ ...prev, [configId]: newState }));
    
    // Fetch users when opening the collapsible if not already loaded
    if (newState && (!clientUsers[configId] || clientUsers[configId]?.length === 0)) {
      fetchClientUsers(configId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="bg-muted/20 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">Aucune configuration WordPress</h3>
        <p className="text-muted-foreground mb-4">
          {!readOnly ? "Commencez par ajouter une nouvelle configuration WordPress." : "Aucune configuration WordPress ne vous a été attribuée."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {configs.map((config) => (
        <Card key={config.id} className="overflow-hidden">
          <CardHeader className="bg-muted/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
              <div>
                <CardTitle className="break-words">{config.name}</CardTitle>
                <CardDescription className="mt-1 break-all">
                  <a 
                    href={config.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {config.site_url}
                  </a>
                </CardDescription>
              </div>
              <WordPressConnectionStatus 
                configId={config.id}
              />
            </div>
          </CardHeader>
          
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Nom d'utilisateur (App)</h4>
                <div className="text-sm text-muted-foreground">
                  {config.app_username ? (
                    <span>{config.app_username}</span>
                  ) : (
                    <span>Non défini</span>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Mot de passe (App)</h4>
                <div className="text-sm text-muted-foreground">
                  {config.app_password ? (
                    <Badge variant="outline" className="font-mono">
                      {"••••••••••••"}
                    </Badge>
                  ) : (
                    <span>Non défini</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Collapsible
                open={openCollapsibles[config.id]}
                onOpenChange={() => toggleCollapsible(config.id)}
                className="border rounded-md"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between p-4 rounded-none">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Utilisateurs clients
                    </span>
                    <span className="text-muted-foreground">
                      {clientUsers[config.id]?.length || 0} utilisateur(s)
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  {loadingUsers[config.id] ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : clientUsers[config.id]?.length ? (
                    <div className="space-y-3">
                      {clientUsers[config.id].map(user => (
                        <div key={user.id} className="border rounded p-3">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      Aucun utilisateur client associé à cette configuration.
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
          
          {!readOnly && (
            <CardFooter className="border-t bg-muted/10 pt-4 flex flex-col sm:flex-row sm:justify-end gap-2">
              <WordPressConfigForm
                config={config}
                onSubmit={(data) => onUpdateConfig(config.id, data)}
                buttonText="Modifier"
                dialogTitle="Modifier la configuration WordPress"
                dialogDescription="Mettez à jour les informations de configuration."
                isSubmitting={isSubmitting}
                trigger={
                  <Button variant="outline" size="sm" className={`${isMobile ? 'w-full' : ''}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                }
              />
              
              <AlertDialog open={configToDelete === config.id} onOpenChange={(open) => !open && setConfigToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setConfigToDelete(config.id)}
                    className={`${isMobile ? 'w-full' : ''}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action ne peut pas être annulée. Cette configuration sera définitivement supprimée
                      de nos serveurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel className={`${isMobile ? 'w-full' : ''}`}>Annuler</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting}
                      className={`${isMobile ? 'w-full' : ''}`}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Suppression...
                        </>
                      ) : (
                        "Continuer"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
};

export default WordPressConfigList;
