
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

interface WordPressSiteFilterProps {
  selectedSite: string;
  onSiteChange: (siteId: string) => void;
}

const WordPressSiteFilter = ({ selectedSite, onSiteChange }: WordPressSiteFilterProps) => {
  const { configs, isLoading } = useWordPressConfigs();

  if (isLoading) {
    return (
      <div className="w-full md:w-[200px]">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Chargement..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-full md:w-[200px]">
      <Select value={selectedSite} onValueChange={onSiteChange}>
        <SelectTrigger>
          <SelectValue placeholder="Tous les sites" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les sites</SelectItem>
          {configs.map((config) => (
            <SelectItem key={config.id} value={config.id}>
              {config.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default WordPressSiteFilter;
