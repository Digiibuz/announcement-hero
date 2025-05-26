
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings, Globe } from "lucide-react";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";

interface WordPressConfigTabProps {
  form: UseFormReturn<any>;
  configs: WordPressConfig[];
  isLoadingConfigs: boolean;
  selectedConfigIds: string[];
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const WordPressConfigTab: React.FC<WordPressConfigTabProps> = ({
  form,
  configs,
  isLoadingConfigs,
  selectedConfigIds,
  isUpdating,
  onCancel,
  onSubmit
}) => {
  // Get the WordPress config assigned to this user
  const assignedConfig = configs.find(config => selectedConfigIds.includes(config.id));

  const handleConfigUpdate = async (data: any) => {
    // Handle WordPress config update logic here
    console.log('Updating WordPress config:', data);
  };

  if (isLoadingConfigs) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled>
            Mise à jour...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignedConfig ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Site WordPress assigné
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Nom du site</p>
                <p className="text-base">{assignedConfig.name}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">URL du site</p>
                <div className="flex items-center gap-2">
                  <p className="text-base text-blue-600">{assignedConfig.site_url}</p>
                  <a 
                    href={assignedConfig.site_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Statut</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connecté
                </Badge>
              </div>
              
              {assignedConfig.app_username && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</p>
                  <p className="text-base">{assignedConfig.app_username}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t">
              <WordPressConfigForm
                onSubmit={handleConfigUpdate}
                defaultValues={assignedConfig}
                config={assignedConfig}
                buttonText="Modifier la configuration"
                dialogTitle="Modifier la configuration WordPress"
                dialogDescription="Modifiez les paramètres de connexion WordPress"
                isSubmitting={isUpdating}
                trigger={
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Modifier la configuration
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun site WordPress assigné
            </h3>
            <p className="text-gray-600 mb-4">
              Cet utilisateur n'a pas encore de site WordPress configuré.
            </p>
            <Badge variant="secondary">
              Non configuré
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
          {isUpdating ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </div>
    </div>
  );
};

export default WordPressConfigTab;
