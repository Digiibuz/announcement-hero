
import React, { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Settings, Globe, Edit3 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WordPressConfig } from "@/types/wordpress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [isEditingAssignment, setIsEditingAssignment] = useState(false);
  const [newConfigId, setNewConfigId] = useState<string>("");

  // Get the WordPress config assigned to this user
  // Check both selectedConfigIds and form wpConfigIds
  const wpConfigIds = form.getValues("wpConfigIds") || [];
  const allConfigIds = [...selectedConfigIds, ...wpConfigIds];
  const assignedConfig = configs.find(config => 
    allConfigIds.includes(config.id) || 
    (userRole === "client" && configs.some(c => c.id === config.id))
  );

  console.log("WordPressConfigTab - Debug:", {
    selectedConfigIds,
    wpConfigIds: form.getValues("wpConfigIds"),
    allConfigIds,
    assignedConfig,
    userRole,
    configsLength: configs.length
  });

  const handleConfigUpdate = async (data: any) => {
    console.log('Updating WordPress config:', data);
  };

  const handleAssignmentChange = () => {
    if (newConfigId) {
      form.setValue("wpConfigIds", [newConfigId]);
      setIsEditingAssignment(false);
      console.log("Assignment changed to config:", newConfigId);
    }
  };

  const handleStartEditing = () => {
    setNewConfigId(assignedConfig?.id || "");
    setIsEditingAssignment(true);
  };

  if (isLoadingConfigs) {
    return (
      <ScrollArea className="max-h-[400px] pr-4">
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
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="max-h-[400px] pr-4">
      <div className="space-y-4">
        {assignedConfig || configs.length > 0 ? (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Site WordPress assigné
                {!isEditingAssignment && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleStartEditing}
                    className="ml-auto"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingAssignment ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Sélectionner une configuration WordPress
                    </label>
                    <Select value={newConfigId} onValueChange={setNewConfigId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une configuration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Aucune configuration</SelectItem>
                        {configs.map((config) => (
                          <SelectItem key={config.id} value={config.id}>
                            {config.name} - {config.site_url}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsEditingAssignment(false)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleAssignmentChange}
                    >
                      Confirmer
                    </Button>
                  </div>
                </div>
              ) : assignedConfig ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Aucune configuration sélectionnée
                  </p>
                  <Button variant="outline" onClick={handleStartEditing}>
                    Assigner une configuration
                  </Button>
                </div>
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

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default WordPressConfigTab;
