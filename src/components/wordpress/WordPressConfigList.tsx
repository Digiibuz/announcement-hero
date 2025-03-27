
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigItem from "./WordPressConfigItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  isLoading: boolean;
  isSubmitting: boolean;
  onUpdateConfig: (id: string, data: Partial<WordPressConfig>) => Promise<void>;
  onDeleteConfig: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const WordPressConfigList: React.FC<WordPressConfigListProps> = ({
  configs,
  isLoading,
  isSubmitting,
  onUpdateConfig,
  onDeleteConfig,
  readOnly = false
}) => {
  const { user, isAdmin } = useAuth();
  const { clientConfigs } = useWordPressConfigs();
  
  // Filter configs for editors to show their assigned config AND configs associated with their client
  const filteredConfigs = React.useMemo(() => {
    if (isAdmin) {
      return configs;
    }
    
    const userConfigs = [];
    
    // Add directly assigned WordPress config if exists
    if (user?.wordpressConfigId) {
      const directConfig = configs.find(config => config.id === user.wordpressConfigId);
      if (directConfig) {
        userConfigs.push(directConfig);
      }
    }
    
    // Add configs associated with user's client
    if (user?.clientId) {
      console.log("User clientId:", user.clientId);
      console.log("All client configs:", clientConfigs);
      
      const clientConfigIds = clientConfigs
        .filter(cc => cc.client_id === user.clientId)
        .map(cc => cc.wordpress_config_id);
      
      console.log("Client config IDs for user's client:", clientConfigIds);
      
      // Add client configs if not already added
      for (const config of configs) {
        if (clientConfigIds.includes(config.id) && !userConfigs.some(c => c.id === config.id)) {
          userConfigs.push(config);
        }
      }
    }
    
    console.log("Filtered configs for user:", userConfigs);
    return userConfigs;
  }, [configs, user, isAdmin, clientConfigs]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Chargement des configurations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredConfigs.length === 0) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Aucune configuration</AlertTitle>
        <AlertDescription>
          {isAdmin 
            ? "Aucune configuration WordPress n'a été trouvée. Cliquez sur \"Ajouter une configuration\" pour en créer une nouvelle."
            : user?.wordpressConfigId || user?.clientId
              ? "La configuration WordPress associée à votre compte ou à votre client n'est pas disponible."
              : "Aucune configuration WordPress n'est associée à votre compte ou à votre client. Contactez un administrateur pour en configurer une."
          }
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurations disponibles</CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Liste des configurations WordPress disponibles" 
            : filteredConfigs.length > 1
              ? "Configurations WordPress associées à votre compte et à votre client"
              : "Configuration WordPress associée à votre compte"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {filteredConfigs.map((config) => (
              <WordPressConfigItem
                key={config.id}
                config={config}
                onUpdate={onUpdateConfig}
                onDelete={onDeleteConfig}
                isSubmitting={isSubmitting}
                readOnly={readOnly}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default WordPressConfigList;
