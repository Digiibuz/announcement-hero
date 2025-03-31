import React from "react";
import { WordPressConfig } from "@/types/wordpress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import WordPressConnectionStatus from "./WordPressConnectionStatus";

const WordPressConfigItem = ({ config, onEdit, onDelete }: { config: WordPressConfig, onEdit: (id: string) => void, onDelete: (id: string) => void }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
        <CardDescription className="text-sm truncate">{config.site_url}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm mb-4">
          <div className="mb-2">
            <strong>Méthode d'authentification:</strong>{" "}
            {config.app_username && config.app_password ? (
              <span className="text-green-600">Application Password</span>
            ) : config.rest_api_key ? (
              <span className="text-green-600">Clé API REST</span>
            ) : (
              <span className="text-amber-600">Non configurée</span>
            )}
          </div>
          <WordPressConnectionStatus configId={config.id} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(config.id)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(config.id)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </CardFooter>
    </Card>
  );
};

interface WordPressConfigListProps {
  configs: WordPressConfig[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

const WordPressConfigList = ({ configs, onEdit, onDelete, isLoading }: WordPressConfigListProps) => {
  if (isLoading) {
    return <p>Chargement des configurations WordPress...</p>;
  }

  if (!configs || configs.length === 0) {
    return <p>Aucune configuration WordPress disponible.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {configs.map((config) => (
        <WordPressConfigItem
          key={config.id}
          config={config}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default WordPressConfigList;
