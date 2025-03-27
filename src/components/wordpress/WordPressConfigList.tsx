
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigItem from "./WordPressConfigItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

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
  
  // Filter configs for editors to only show their assigned config
  const filteredConfigs = React.useMemo(() => {
    if (isAdmin) {
      return configs;
    }
    
    if (user?.wordpressConfigId) {
      return configs.filter(config => config.id === user.wordpressConfigId);
    }
    
    return [];
  }, [configs, user, isAdmin]);

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
            : user?.wordpressConfigId 
              ? "La configuration WordPress associée à votre compte n'est pas disponible."
              : "Aucune configuration WordPress n'est associée à votre compte. Contactez un administrateur pour en configurer une."
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
