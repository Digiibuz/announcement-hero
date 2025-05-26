
import React, { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings, Globe, Save } from "lucide-react";
import { WordPressConfig } from "@/types/wordpress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import WordPressConfigForm from "@/components/wordpress/WordPressConfigForm";

interface WordPressConfigTabProps {
  form: UseFormReturn<any>;
  configs: WordPressConfig[];
  isLoadingConfigs: boolean;
  selectedConfigIds: string[];
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  userId?: string;
  userRole?: string;
}

const WordPressConfigTab: React.FC<WordPressConfigTabProps> = ({
  form,
  configs,
  isLoadingConfigs,
  selectedConfigIds,
  isUpdating,
  onCancel,
  onSubmit,
  userId,
  userRole
}) => {
  // Get the WordPress config assigned to this user
  const wpConfigIds = form.getValues("wpConfigIds") || [];
  const allConfigIds = [...selectedConfigIds, ...wpConfigIds];
  const assignedConfig = configs.find(config => allConfigIds.includes(config.id));
  
  // État local pour le menu déroulant - initialiser avec la config assignée
  const [selectedConfigId, setSelectedConfigId] = useState<string>("none");

  // Mettre à jour selectedConfigId quand la config assignée change
  useEffect(() => {
    if (assignedConfig?.id) {
      setSelectedConfigId(assignedConfig.id);
    } else {
      setSelectedConfigId("none");
    }
  }, [assignedConfig?.id]);

  console.log("WordPressConfigTab - Debug:", {
    selectedConfigIds,
    wpConfigIds: form.getValues("wpConfigIds"),
    allConfigIds,
    assignedConfig,
    userRole,
    configsLength: configs.length,
    selectedConfigId
  });

  const handleConfigUpdate = async (data: any) => {
    console.log('Updating WordPress config:', data);
  };

  // Update form when dropdown selection changes
  const handleConfigChange = (value: string) => {
    console.log("WordPressConfigTab - Config change:", { value, previousValue: selectedConfigId });
    setSelectedConfigId(value);
    if (value && value !== "none") {
      form.setValue("wpConfigIds", [value]);
    } else {
      form.setValue("wpConfigIds", []);
    }
  };

  if (isLoadingConfigs) {
    return (
      <ScrollArea className="max-h-[400px] pr-4">
        <div className="space-y-4">
          {/* Bouton Enregistrer en haut */}
          <div className="flex justify-between items-center">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="button" disabled>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="max-h-[400px] pr-4">
      <div className="space-y-4">
        {/* Bouton Enregistrer en haut */}
        <div className="flex justify-between items-center">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
            <Save className="h-4 w-4 mr-2" />
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        {configs.length > 0 ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Site WordPress assigné
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Menu déroulant pour sélectionner la configuration */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Configuration WordPress
                </label>
                <Select value={selectedConfigId} onValueChange={handleConfigChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune configuration</SelectItem>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name} - {config.site_url}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Affichage des détails de la configuration sélectionnée */}
              {selectedConfigId && selectedConfigId !== "none" && (
                <>
                  {(() => {
                    const currentConfig = configs.find(config => config.id === selectedConfigId);
                    if (!currentConfig) return null;
                    
                    return (
                      <>
                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-gray-900 mb-3">Détails de la configuration</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Nom du site</p>
                              <p className="text-base">{currentConfig.name}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">URL du site</p>
                              <div className="flex items-center gap-2">
                                <p className="text-base text-blue-600">{currentConfig.site_url}</p>
                                <a 
                                  href={currentConfig.site_url} 
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
                            
                            {currentConfig.app_username && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</p>
                                <p className="text-base">{currentConfig.app_username}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <WordPressConfigForm
                            onSubmit={handleConfigUpdate}
                            defaultValues={currentConfig}
                            config={currentConfig}
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
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune configuration WordPress disponible
              </h3>
              <p className="text-gray-600 mb-4">
                Il n'y a aucune configuration WordPress disponible dans le système.
              </p>
              <Badge variant="secondary">
                Non configuré
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default WordPressConfigTab;
