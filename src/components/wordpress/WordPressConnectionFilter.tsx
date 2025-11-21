import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface WordPressConnectionFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const WordPressConnectionFilter = ({ value, onChange }: WordPressConnectionFilterProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filtrer par statut" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les sites</SelectItem>
        <SelectItem value="connected">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20">
              Connecté
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="partial">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-500">
              Partiel
            </Badge>
          </div>
        </SelectItem>
        <SelectItem value="disconnected">
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              Déconnecté
            </Badge>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default WordPressConnectionFilter;
