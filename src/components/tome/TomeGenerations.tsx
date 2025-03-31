
import React, { useState, useEffect } from "react";
import { useTomeGeneration } from "@/hooks/tome";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Calendar, ExternalLink, Clock, Eye } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import GeneratedContentDialog from "./GeneratedContentDialog";

interface TomeGenerationsProps {
  configId: string;
  isClientView?: boolean;
}

const TomeGenerations: React.FC<TomeGenerationsProps> = ({ configId, isClientView = false }) => {
  const { 
    generations, 
    isLoading: isLoadingGenerations, 
    isSubmitting,
    createGeneration,
    regenerate,
    fetchGenerations,
    generatedContent,
    fetchGeneratedContent
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
  const [viewingGeneration, setViewingGeneration] = useState<{
    id: string;
    title: string;
    postId: number | null;
    siteUrl?: string;
  } | null>(null);

  // Set to track generations that are currently polling for status updates
  const [pollingGenerations, setPollingGenerations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoadingKeywords && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id.toString());
    }
  }, [categories, isLoadingKeywords, selectedCategory]);

  useEffect(() => {
    fetchGenerations();
    
    // Setup polling for generations that are in progress
    const pendingGenerations = generations.filter(
      g => g.status === 'pending' || g.status === 'processing'
    );
    
    if (pendingGenerations.length > 0) {
      const interval = setInterval(() => {
        fetchGenerations();
      }, 10000); // Poll every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [configId]);

  // Handle viewing content
  const handleViewContent = async (generationId: string, postId: number | null, title: string) => {
    if (!postId) return;
    
    // Find the base URL for the WordPress site
    const generation = generations.find(g => g.id === generationId);
    if (!generation) return;

    // Get site URL from the category
    const categoryDetails = categories.find(c => c.id.toString() === generation.category_id);
    const siteUrl = categoryDetails?.link?.split('/wp-json/')[0] || 
                   (categories.length > 0 && categories[0]?.link?.split('/wp-json/')[0]);
    
    setViewingGeneration({
      id: generationId,
      title,
      postId,
      siteUrl
    });
    
    // Fetch the content if we don't have it yet
    if (!generatedContent[generationId] && postId) {
      await fetchGeneratedContent(generationId, postId);
    }
  };

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

  // Get post URL for the viewing generation
  const getPostUrl = () => {
    if (!viewingGeneration || !viewingGeneration.postId || !viewingGeneration.siteUrl) return null;
    
    return `${viewingGeneration.siteUrl}/?p=${viewingGeneration.postId}`;
  };

  return (
    <div className="space-y-6">
      {!isClientView && (
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
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{isClientView ? "Demander une nouvelle publication" : "Nouvelle génération"}</CardTitle>
          {isClientView && (
            <CardDescription>
              Planifiez ou générez immédiatement de nouvelles publications pour votre site
            </CardDescription>
          )}
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
                    {/* Fix: Change empty string to a non-empty string with a special value */}
                    <SelectItem key="no-keyword" value="none">Aucun mot-clé</SelectItem>
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
                    {/* Fix: Change empty string to a non-empty string with a special value */}
                    <SelectItem key="no-locality" value="none">Aucune localité</SelectItem>
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
          <CardTitle>
            {isClientView ? "Vos publications générées" : "Historique des générations"}
          </CardTitle>
          {isClientView && (
            <CardDescription>
              Consultez les contenus générés pour votre site avec vos mots-clés et localités
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {generations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {isClientView 
                  ? "Aucune publication n'a encore été générée pour votre site" 
                  : "Aucune génération n'a été effectuée"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generations.map((generation) => {
                const keywordDetails = generation.keyword_id 
                  ? keywords.find(k => k.id === generation.keyword_id) 
                  : null;
                
                const localityDetails = generation.locality_id
                  ? allLocalities.find(l => l.id === generation.locality_id)
                  : null;
                  
                const categoryDetails = categories.find(c => c.id.toString() === generation.category_id);
                
                let statusLabel = "";
                let statusColor = "";
                let statusProgress = 0;
                
                switch (generation.status) {
                  case 'pending':
                    statusLabel = "En attente";
                    statusColor = "bg-amber-100 text-amber-800";
                    statusProgress = 10;
                    break;
                  case 'processing':
                    statusLabel = "En cours";
                    statusColor = "bg-blue-100 text-blue-800";
                    statusProgress = 50;
                    break;
                  case 'scheduled':
                    statusLabel = "Planifiée";
                    statusColor = "bg-purple-100 text-purple-800";
                    statusProgress = 0;
                    break;
                  case 'published':
                    statusLabel = "Publiée";
                    statusColor = "bg-green-100 text-green-800";
                    statusProgress = 100;
                    break;
                  case 'failed':
                    statusLabel = "Échec";
                    statusColor = "bg-red-100 text-red-800";
                    statusProgress = 0;
                    break;
                  default:
                    statusLabel = generation.status;
                    statusColor = "bg-gray-100 text-gray-800";
                    statusProgress = 0;
                }
                
                // Show processing indicator with progress
                const showProgress = generation.status === 'pending' || generation.status === 'processing';
                
                return (
                  <div key={generation.id} className="border rounded-md p-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="w-full md:w-3/4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-md ${statusColor}`}>
                            {statusLabel}
                          </span>
                          
                          {generation.status === 'scheduled' && generation.scheduled_at ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Publication prévue le {format(new Date(generation.scheduled_at), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </Badge>
                          ) : generation.published_at ? (
                            <span className="text-sm text-muted-foreground">
                              Publiée le {format(new Date(generation.published_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Créée le {format(new Date(generation.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                        
                        {showProgress && (
                          <div className="mb-3">
                            <Progress 
                              value={statusProgress} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {generation.status === 'pending' 
                                ? "En file d'attente, la génération va démarrer bientôt..." 
                                : "Génération et publication en cours..."}
                            </p>
                          </div>
                        )}
                        
                        <h3 className="text-lg font-medium">
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
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {generation.status === 'published' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2"
                            onClick={() => handleViewContent(
                              generation.id, 
                              generation.wordpress_post_id,
                              categoryDetails?.name || "Contenu généré"
                            )}
                          >
                            <Eye className="h-4 w-4" />
                            Voir le contenu
                          </Button>
                        )}
                        
                        {generation.wordpress_post_id && (
                          <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                            <a 
                              href={`${categoryDetails?.link?.split('/wp-json/')[0] || 
                                (categories.length > 0 && categories[0]?.link?.split('/wp-json/')[0]) || 
                                '#'}${isClientView ? `/?p=${generation.wordpress_post_id}` : `/wp-admin/post.php?post=${generation.wordpress_post_id}&action=edit`}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {isClientView ? "Voir la page" : "Voir dans WordPress"}
                              <ExternalLink className="h-4 w-4" />
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

      {/* Dialog to display content */}
      <GeneratedContentDialog
        isOpen={!!viewingGeneration}
        onClose={() => setViewingGeneration(null)}
        title={viewingGeneration?.title || "Contenu généré"}
        content={viewingGeneration ? generatedContent[viewingGeneration.id] : null}
        postUrl={getPostUrl()}
      />
    </div>
  );
};

export default TomeGenerations;
