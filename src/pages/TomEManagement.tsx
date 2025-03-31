import React, { useState, useEffect } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import ContentGenerator from "@/components/tom-e/ContentGenerator";
import KeywordsManager from "@/components/tom-e/KeywordsManager";
import LocalitiesManager from "@/components/tom-e/LocalitiesManager";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { Button } from "@/components/ui/button";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const TomEManagement = () => {
  const { isAdmin, isClient, user } = useAuth();
  const { configs, isLoading: isLoadingConfigs } = useWordPressConfigs();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [allKeywords, setAllKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);
  const [keywordsError, setKeywordsError] = useState<string | null>(null);
  const [didInitialize, setDidInitialize] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { localities, isLoading: isLoadingLocalities } = useLocalities();
  const { 
    categories, 
    isLoading: isLoadingCategories, 
    hasCategories,
    refetch: refetchCategories 
  } = useWordPressCategories(selectedConfigId);
  
  const { fetchAllKeywordsForWordPressConfig } = useCategoryKeywords(selectedConfigId, "");
  
  useEffect(() => {
    if (isLoadingConfigs || didInitialize) return;
    
    if (configs.length > 0) {
      if (isClient && user?.wordpressConfigId) {
        setSelectedConfigId(user.wordpressConfigId);
      } else if (isAdmin && configs[0]?.id) {
        setSelectedConfigId(configs[0].id);
      }
      setDidInitialize(true);
    }
  }, [isLoadingConfigs, configs, isClient, isAdmin, user, didInitialize]);
  
  useEffect(() => {
    if (!selectedConfigId) return;
    
    const loadKeywords = async () => {
      try {
        setIsLoadingKeywords(true);
        setKeywordsError(null);
        
        console.info(`Loading keywords for WordPress config ID: ${selectedConfigId}`);
        const keywords = await fetchAllKeywordsForWordPressConfig(selectedConfigId);
        
        if (Array.isArray(keywords)) {
          setAllKeywords(keywords);
          console.info(`Successfully loaded ${keywords.length} keywords`);
        } else {
          console.warn("Keywords is not an array:", keywords);
          setAllKeywords([]);
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement des mots-clés:", error);
        setKeywordsError(error.message || "Erreur inconnue");
        setAllKeywords([]);
      } finally {
        setIsLoadingKeywords(false);
      }
    };
    
    loadKeywords();
  }, [selectedConfigId, fetchAllKeywordsForWordPressConfig]);
  
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
  };
  
  const handleRefresh = async () => {
    if (!selectedConfigId) return;
    
    setIsRefreshing(true);
    
    try {
      await refetchCategories();
      
      try {
        setIsLoadingKeywords(true);
        const keywords = await fetchAllKeywordsForWordPressConfig(selectedConfigId);
        
        if (Array.isArray(keywords)) {
          setAllKeywords(keywords);
        }
      } catch (error) {
        console.error("Erreur lors du rafraîchissement des mots-clés:", error);
      } finally {
        setIsLoadingKeywords(false);
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      toast.error("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const isReadyForGeneration = 
    selectedConfigId && 
    categories?.length > 0 && 
    localities?.length > 0 && 
    allKeywords?.length > 0;
  
  const isLoading = isLoadingConfigs || isLoadingCategories || isLoadingLocalities || isLoadingKeywords || isRefreshing;
  
  const hasAccess = isAdmin || isClient;
  
  if (!hasAccess) {
    return (
      <PageLayout title="Tom-E - Générateur de contenu">
        <AccessDenied />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout 
      title="Tom-E - Générateur de contenu"
      description="Créez et publiez automatiquement du contenu SEO ciblé pour vos sites WordPress"
      titleAction={
        selectedConfigId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Rafraîchir
          </Button>
        )
      }
    >
      <AnimatedContainer delay={200}>
        <div className="space-y-6">
          {isAdmin && configs && configs.length > 0 && (
            <div className="w-full max-w-xs">
              <Select
                value={selectedConfigId}
                onValueChange={handleConfigChange}
                disabled={isLoadingConfigs}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site WordPress" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map(config => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedConfigId ? (
            <Tabs defaultValue="generator">
              <TabsList className="mb-4">
                <TabsTrigger value="generator">Générateur</TabsTrigger>
                <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                <TabsTrigger value="localities">Localités</TabsTrigger>
              </TabsList>
              
              <TabsContent value="generator">
                {isLoading ? (
                  <Card>
                    <CardContent className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Chargement des données...</span>
                    </CardContent>
                  </Card>
                ) : keywordsError ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center text-destructive mb-4">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Erreur lors du chargement des mots-clés</h3>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {keywordsError}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Essayez de rafraîchir la page ou contactez l'administrateur système.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh} 
                        className="mt-4"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Réessayer
                      </Button>
                    </CardContent>
                  </Card>
                ) : !isReadyForGeneration ? (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center text-amber-500 mb-4">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <h3 className="font-medium">Configuration requise</h3>
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Pour pouvoir générer du contenu avec Tom-E, vous devez d'abord configurer :
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {!categories || categories.length === 0 && (
                          <li>Des catégories WordPress (aucune catégorie trouvée)</li>
                        )}
                        {!allKeywords || allKeywords.length === 0 && (
                          <li>Des mots-clés pour au moins une catégorie (aucun mot-clé ajouté)</li>
                        )}
                        {!localities || localities.length === 0 && (
                          <li>Des localités (aucune localité ajoutée)</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <ContentGenerator
                    wordpressConfigId={selectedConfigId}
                    categories={categories || []}
                    localities={localities || []}
                    keywords={allKeywords || []}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="keywords">
                {isLoadingCategories ? (
                  <Card>
                    <CardContent className="flex items-center justify-center p-6">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span>Chargement des catégories...</span>
                    </CardContent>
                  </Card>
                ) : !categories || categories.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                      <p>Aucune catégorie WordPress n'a été trouvée pour ce site.</p>
                      <p className="text-sm mt-2">
                        Assurez-vous que le site WordPress est correctement configuré et que les identifiants sont valides.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh} 
                        className="mt-4"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Réessayer
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <KeywordsManager
                    wordpressConfigId={selectedConfigId}
                    categories={categories}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="localities">
                <LocalitiesManager />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                <p>Aucun site WordPress n'est configuré.</p>
                <p className="text-sm mt-2">
                  Vous devez d'abord configurer au moins un site WordPress pour utiliser Tom-E.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default TomEManagement;
