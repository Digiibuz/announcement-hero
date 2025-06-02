
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
import { useAuth } from "@/context/AuthContext";
import WordPressSiteFilter from "./WordPressSiteFilter";

interface FilterState {
  search: string;
  status: string;
  wordpressSite?: string;
}

interface AnnouncementFilterProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}

const AnnouncementFilter = ({ filter, setFilter }: AnnouncementFilterProps) => {
  const { isAdmin, isCommercial, isImpersonating } = useAuth();
  
  // Afficher le filtre par site pour les admins et commerciaux (pas en mode impersonation)
  const showSiteFilter = (isAdmin || isCommercial) && !isImpersonating;

  console.log('🔍 AnnouncementFilter - showSiteFilter:', showSiteFilter, {
    isAdmin,
    isCommercial,
    isImpersonating
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des annonces..."
          value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          className="pl-9"
        />
      </div>
      
      {showSiteFilter && (
        <WordPressSiteFilter
          selectedSite={filter.wordpressSite || "all"}
          onSiteChange={(siteId) => {
            console.log('🔍 Site filter changed to:', siteId);
            setFilter({ ...filter, wordpressSite: siteId });
          }}
        />
      )}
      
      <div className="w-full md:w-[180px]">
        <Select
          value={filter.status}
          onValueChange={(value) => setFilter({ ...filter, status: value })}
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
