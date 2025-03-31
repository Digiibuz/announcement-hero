
import React, { useState, useEffect } from "react";
import { useTomeGeneration } from "@/hooks/tome";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Calendar } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';

interface TomeGenerationsProps {
  configId: string;
}

const TomeGenerations: React.FC<TomeGenerationsProps> = ({ configId }) => {
  const { 
    generations, 
    isLoading: isLoadingGenerations, 
    isSubmitting,
    createGeneration,
    fetchGenerations
  } = useTomeGeneration(configId);

  const { 
    categories,
    keywords,
    isLoading: isLoadingKeywords,
    getKeywordsForCategory
  } = useCategoriesKeywords(configId);

  const { 
    localities: allLocalities,
    activeLocalities,
    isLoading: isLoadingLocalities
  } = useLocalities(configId);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);

  useEffect(() => {
    if (!isLoadingKeywords && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id.toString());
    }
  }, [categories, isLoadingKeywords, selectedCategory]);

  useEffect(() => {
    fetchGenerations();
  }, [configId]);

  const handleCreateGeneration = async () => {
    if (!selectedCategory) return;
    
    const keywordObj = selectedKeyword 
      ? keywords.find(k => k.id === selectedKeyword) || null
      : null;
      
    const localityObj = selectedLocality
      ? allLocalities.find(l => l.id === selectedLocality) || null
      : null;
    
    const scheduleDateTime = isScheduled ? scheduleDate : null;
    
    await createGeneration(
      selectedCategory, 
      keywordObj,
      localityObj,
      scheduleDateTime
    );
    
    // Reset form
    setSelectedKeyword(null);
    setSelectedLocality(null);
    setScheduleDate(null);
    setIsScheduled(false);
  };

  const isLoading = isLoadingGenerations || isLoadingKeywords || isLoadingLocalities;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedCategoryKeywords = selectedCategory 
    ? getKeywordsForCategory(selectedCategory)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchGenerations()}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle génération</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select
                  value={selectedCategory || ""}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setSelectedKeyword(null);
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="keyword">Mot-clé (optionnel)</Label>
                <Select
                  value={selectedKeyword || ""}
                  onValueChange={setSelectedKeyword}
                  disabled={!selectedCategory || selectedCategoryKeywords.length === 0}
                >
                  <SelectTrigger id="keyword">
                    <SelectValue placeholder={
                      !selectedCategory 
                        ? "Sélectionnez d'abord une catégorie" 
                        : selectedCategoryKeywords.length === 0
                          ? "Aucun mot-clé disponible"
                          : "Sélectionner un mot-clé"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun mot-clé</SelectItem>
                    {selectedCategoryKeywords.map((keyword) => (
                      <SelectItem key={keyword.id} value={keyword.id}>
                        {keyword.keyword}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="locality">Localité (optionnel)</Label>
                <Select
                  value={selectedLocality || ""}
                  onValueChange={setSelectedLocality}
                  disabled={activeLocalities.length === 0}
                >
                  <SelectTrigger id="locality">
                    <SelectValue placeholder={
                      activeLocalities.length === 0
                        ? "Aucune localité disponible"
                        : "Sélectionner une localité"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune localité</SelectItem>
                    {activeLocalities.map((locality) => (
                      <SelectItem key={locality.id} value={locality.id}>
                        {locality.name} {locality.region ? `(${locality.region})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="schedule">Planifier</Label>
                    <Switch
                      id="schedule"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={!isScheduled}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {scheduleDate ? format(scheduleDate, 'PPP', { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={scheduleDate || undefined}
                        onSelect={setScheduleDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-end">
              <Button
                onClick={handleCreateGeneration}
                disabled={!selectedCategory || isSubmitting || (isScheduled && !scheduleDate)}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {isScheduled ? "Planifier" : "Générer maintenant"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Historique des générations</CardTitle>
        </CardHeader>
        <CardContent>
          {generations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Aucune génération n'a été effectuée
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((generation) => {
                // Récupérer les détails du mot-clé et de la localité
                const keywordDetails = generation.keyword_id 
                  ? keywords.find(k => k.id === generation.keyword_id) 
                  : null;
                
                const localityDetails = generation.locality_id
                  ? allLocalities.find(l => l.id === generation.locality_id)
                  : null;
                  
                const categoryDetails = categories.find(c => c.id.toString() === generation.category_id);
                
                let statusLabel = "";
                let statusColor = "";
                
                switch (generation.status) {
                  case 'pending':
                    statusLabel = "En attente";
                    statusColor = "bg-amber-100 text-amber-800";
                    break;
                  case 'processing':
                    statusLabel = "En cours";
                    statusColor = "bg-blue-100 text-blue-800";
                    break;
                  case 'scheduled':
                    statusLabel = "Planifiée";
                    statusColor = "bg-purple-100 text-purple-800";
                    break;
                  case 'published':
                    statusLabel = "Publiée";
                    statusColor = "bg-green-100 text-green-800";
                    break;
                  case 'failed':
                    statusLabel = "Échec";
                    statusColor = "bg-red-100 text-red-800";
                    break;
                  default:
                    statusLabel = generation.status;
                    statusColor = "bg-gray-100 text-gray-800";
                }
                
                return (
                  <div key={generation.id} className="border rounded-md p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${statusColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(generation.created_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <h3 className="text-lg font-medium mt-1">
                          {categoryDetails?.name || generation.category_id}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {keywordDetails && (
                            <p className="text-sm">
                              <span className="font-medium">Mot-clé:</span> {keywordDetails.keyword}
                            </p>
                          )}
                          {localityDetails && (
                            <p className="text-sm">
                              <span className="font-medium">Localité:</span> {localityDetails.name}
                              {localityDetails.region ? ` (${localityDetails.region})` : ''}
                            </p>
                          )}
                          {generation.scheduled_at && (
                            <p className="text-sm">
                              <span className="font-medium">Planifiée pour:</span> {format(new Date(generation.scheduled_at), 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {generation.wordpress_post_id && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${categories[0]?.link?.split('/wp-json/')[0]}/wp-admin/post.php?post=${generation.wordpress_post_id}&action=edit`} target="_blank" rel="noopener noreferrer">
                              Voir dans WordPress
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Composant Switch importé de shadcn/ui
const Switch = ({ id, checked, onCheckedChange }: { id: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className={`
          h-6 w-11 rounded-full transition-colors
          ${checked ? 'bg-primary' : 'bg-input'}
          peer-focus:outline-none peer-focus:ring-2
          peer-focus:ring-offset-2 peer-focus:ring-primary
          relative
        `}>
          <div className={`
            h-5 w-5 rounded-full bg-white absolute 
            top-[2px] transition-transform 
            ${checked ? 'translate-x-5 left-5' : 'translate-x-0 left-[2px]'}
          `} />
        </div>
      </label>
    </div>
  );
};

export default TomeGenerations;
