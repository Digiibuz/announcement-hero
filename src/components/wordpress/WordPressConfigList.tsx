
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WordPressConfig } from "@/types/wordpress";
import WordPressConfigItem from "./WordPressConfigItem";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  if (configs.length === 0) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Aucune configuration</AlertTitle>
        <AlertDescription>
          Aucune configuration WordPress n'a été trouvée. Cliquez sur "Ajouter une configuration" pour en créer une nouvelle.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurations disponibles</CardTitle>
        <CardDescription>
          Liste des configurations WordPress disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {configs.map((config) => (
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
