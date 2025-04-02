
import React, { useState, useEffect } from "react";
import { useTomeSimplified } from "@/hooks/tome";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ExternalLink, Eye, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GeneratedContentDialog from "./GeneratedContentDialog";

interface TomeSimplifiedProps {
  configId: string;
  isClientView?: boolean;
}

const TomeSimplified: React.FC<TomeSimplifiedProps> = ({ configId, isClientView = false }) => {
  const { 
    generations, 
    isLoading: isLoadingGenerations, 
    isSubmitting,
    createGeneration,
    regenerate,
    fetchGenerations
  } = useTomeSimplified(configId);

  const { 
    categories,
    keywords,
    isLoading: isLoadingKeywords,
    getKeywordsForCategory
  } = useCategoriesKeywords(configId);

  const { 
    activeLocalities,
    isLoading: isLoadingLocalities
  } = useLocalities(configId);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<string | null>(null);
  const [viewingGeneration, setViewingGeneration] = useState<{
    id: string;
    title: string;
    content: string | null;
  } | null>(null);

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
  }, [configId, fetchGenerations]);

  // Handle viewing content
  const handleViewContent = (generationId: string, title: string, content: string | null) => {
    setViewingGeneration({
      id: generationId,
      title,
      content
    });
  };

  const handleCreateGeneration = async () => {
    if (!selectedCategory) return;
    
    const keywordObj = selectedKeyword 
      ? keywords.find(k => k.id === selectedKeyword) || null
      : null;
      
    const localityObj = selectedLocality
      ? activeLocalities.find(l => l.id === selectedLocality) || null
      : null;
    
    await createGeneration(
      selectedCategory, 
      keywordObj,
      localityObj
    );
    
    setSelectedKeyword(null);
    setSelectedLocality(null);
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
              Générez rapidement du contenu optimisé pour votre site WordPress
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <SelectItem key="no-locality" value="none">Aucune localité</SelectItem>
                    {activeLocalities.map((locality) => (
                      <SelectItem key={locality.id} value={locality.id}>
                        {locality.name} {locality.region ? `(${locality.region})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleCreateGeneration}
                disabled={!selectedCategory || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Générer maintenant
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
              Consultez vos contenus générés avec Tom-E
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
                const keywordText = generation.keyword_text || null;
                const localityName = generation.locality_name || null;
                const localityRegion = generation.locality_region || null;
                const categoryName = generation.category_name || generation.category_id;
                
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
                  case 'ready':
                    statusLabel = "Prêt";
                    statusColor = "bg-green-100 text-green-800";
                    statusProgress = 100;
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
                          
                          {generation.published_at ? (
                            <span className="text-sm text-muted-foreground">
                              Publiée le {format(new Date(generation.published_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Créée le {format(new Date(generation.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                        
                        {/* Afficher le message d'erreur si présent */}
                        {generation.status === 'failed' && generation.error_message && (
                          <Alert variant="destructive" className="mb-3 py-2">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <AlertDescription className="text-xs">
                              {generation.error_message}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {showProgress && (
                          <div className="mb-3">
                            <Progress 
                              value={statusProgress} 
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {generation.status === 'pending' 
                                ? "En file d'attente, la génération va démarrer bientôt..." 
                                : "Génération et publication en cours (3-5 minutes)..."}
                            </p>
                          </div>
                        )}
                        
                        <h3 className="text-lg font-medium">
                          {generation.title || categoryName}
                        </h3>
                        <div className="mt-1 space-y-1">
                          {keywordText && (
                            <p className="text-sm">
                              <span className="font-medium">Mot-clé:</span> {keywordText}
                            </p>
                          )}
                          {localityName && (
                            <p className="text-sm">
                              <span className="font-medium">Localité:</span> {localityName}
                              {localityRegion ? ` (${localityRegion})` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap space-x-2">
                        {generation.status === 'failed' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2 mb-2 md:mb-0"
                            onClick={() => regenerate(generation.id)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Réessayer
                          </Button>
                        )}
                        
                        {(generation.status === 'published' || generation.status === 'ready') && generation.content && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-2 mb-2 md:mb-0"
                            onClick={() => handleViewContent(
                              generation.id, 
                              generation.title || categoryName,
                              generation.content
                            )}
                          >
                            <Eye className="h-4 w-4" />
                            Voir le contenu
                          </Button>
                        )}
                        
                        {generation.wordpress_post_id && (
                          <Button variant="outline" size="sm" className="flex items-center gap-2 mb-2 md:mb-0" asChild>
                            <a 
                              href={`${generation.wordpress_site_url || '#'}${isClientView ? `/?p=${generation.wordpress_post_id}` : `/wp-admin/post.php?post=${generation.wordpress_post_id}&action=edit`}`} 
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
        content={viewingGeneration?.content || null}
        postUrl={null}
        error={null}
      />
    </div>
  );
};

export default TomeSimplified;
