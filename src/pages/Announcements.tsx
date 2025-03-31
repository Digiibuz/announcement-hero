
import { useEffect, useState } from 'react';
import { useAnnouncements, FilterState } from '@/hooks/useAnnouncements';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import PageLayout from '@/components/ui/layout/PageLayout';
import AnnouncementList from '@/components/announcements/AnnouncementList';
import AnnouncementFilter from '@/components/announcements/AnnouncementFilter';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { useIsMobile } from '@/hooks/use-media-query';
import AnimatedContainer from '@/components/ui/AnimatedContainer';

const Announcements = () => {
  const [showFilters, setShowFilters] = useState(false);
  const { announcements, isLoading, error, filters, updateFilters, refreshAnnouncements } = useAnnouncements();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Ajuster le titre de la page
    document.title = 'Annonces | Digiibuz';
  }, []);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    // Map the search property to searchTerm for backward compatibility
    const mappedFilters: Partial<FilterState> = {
      ...newFilters,
      // Rename search to searchTerm if it exists in newFilters
      searchTerm: newFilters.searchTerm || filters.searchTerm,
    };
    
    updateFilters(mappedFilters);
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <PageLayout
      title="Mes annonces"
      description="Gérez vos annonces immobilières"
      actions={
        <Button onClick={handleCreateNew} size="sm">
          <Plus className="h-4 w-4 mr-2" /> 
          Nouvelle annonce
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFilters}
            className="md:hidden"
          >
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
          
          <div className="hidden md:block">
            <AnnouncementFilter 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </div>

          {showFilters && (
            <div className="md:hidden w-full mt-2">
              <AnnouncementFilter 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-4 text-destructive">
            Une erreur est survenue: {error}
          </div>
        ) : announcements.length === 0 ? (
          <AnimatedContainer className="text-center p-8 bg-muted/40 rounded-lg border border-border">
            <h3 className="text-lg font-medium mb-2">Aucune annonce trouvée</h3>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore créé d'annonces ou aucune annonce ne correspond à vos filtres.
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" /> 
              Créer une nouvelle annonce
            </Button>
          </AnimatedContainer>
        ) : (
          <AnnouncementList 
            announcements={announcements} 
            onRefresh={refreshAnnouncements} 
          />
        )}
      </div>

      {isMobile && (
        <FloatingActionButton
          icon={<Plus className="h-5 w-5" />}
          onClick={handleCreateNew}
          label="Nouvelle annonce"
        />
      )}
    </PageLayout>
  );
};

export default Announcements;
