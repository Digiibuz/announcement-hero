import React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterState {
  search: string;
  status: string;
}

interface AnnouncementFilterProps {
  filter: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
  categories: DipiCptCategory[];
  loading: boolean;
}

const AnnouncementFilter = ({ filter, onFilterChange, categories, loading }: AnnouncementFilterProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des annonces..."
          value={filter.search}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="w-full md:w-[180px]">
        <Select
          value={filter.status}
          onValueChange={(value) => onFilterChange({ ...filter, status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="scheduled">Programmé</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default AnnouncementFilter;
