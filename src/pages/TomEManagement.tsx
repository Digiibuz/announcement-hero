
import React, { useState, useEffect } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AccessDenied from "@/components/ui/AccessDenied";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useWordPressCategories } from "@/hooks/useWordPressCategories";
import { useLocalities } from "@/hooks/useLocalities";
import { useCategoryKeywords } from "@/hooks/useCategoryKeywords";
import KeywordsManager from "@/components/tom-e/KeywordsManager";
import LocalitiesManager from "@/components/tom-e/LocalitiesManager";
import ContentGenerator from "@/components/tom-e/ContentGenerator";
import { ContentGeneratorProps } from "@/types/tom-e";

const TomEManagement = () => {
  const { isAdmin, isClient } = useAuth();
  const { configs, isLoading: isLoadingConfigs } = useWordPressConfigs();
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("generator");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { categories, isLoading: isLoadingCategories } = useWordPressCategories(selectedConfigId);
  const { localities, isLoading: isLoadingLocalities } = useLocalities();
  
  // Préchargement des mots-clés pour toutes les catégories
  const { fetchAllKeywordsForWordPressConfig, isLoading: isLoadingKeywords } = 
    useCategoryKeywords(selectedConfigId, "");
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isLoadingAllKeywords, setIsLoadingAllKeywords] = useState(false);

  useEffect(() => {
    // Définir la configuration par défaut si disponible
    if (configs && configs.length > 0 && !selectedConfigId) {
      setSelectedConfigId(configs[0].id);
    }
  }, [configs, selectedConfigId]);

  useEffect(() => {
    // Charger tous les mots-clés pour la configuration sélectionnée
    const loadAllKeywords = async () => {
      if (!selectedConfigId) return;
      
      try {
        setIsLoadingAllKeywords(true);
        const allKeywords = await fetchAllKeywordsForWordPressConfig(selectedConfigId);
        setKeywords(allKeywords || []);
      } catch (error) {
        console.error("Erreur lors du chargement des mots-clés:", error);
      } finally {
        setIsLoadingAllKeywords(false);
      }
    };
    
    loadAllKeywords();
  }, [selectedConfigId, fetchAllKeywordsForWordPressConfig]);
  
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Recharger toutes les données nécessaires
      if (selectedConfigId) {
        const keywordsData = await fetchAllKeywordsForWordPressConfig(selectedConfigId);
        setKeywords(keywordsData || []);
      }
      
      toast.success("Données rafraîchies avec succès");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données:", error);
      toast.error("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const isLoading = isLoadingConfigs || isLoadingCategories || isLoadingLocalities || isLoadingAllKeywords;
  const hasAccess = isAdmin || isClient;
  
  if (!hasAccess) {
    return (
      <PageLayout title="Tom-E - Générateur de contenu">
        <AccessDenied />
      </PageLayout>
    );
  }
  
  const contentGeneratorProps: ContentGeneratorProps = {
    wordpressConfigId: selectedConfigId,
    categories: categories || [],
    localities: localities || [],
    keywords: keywords || []
  };
  
  return (
    <PageLayout 
      title="Tom-E - Générateur de contenu"
      description="Créez et publiez du contenu optimisé pour le SEO"
      titleAction={
        selectedConfigId && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Rafraîchir
          </Button>
        )
      }
    >
      <AnimatedContainer delay={200}>
        <div className="space-y-6">
          {configs && configs.length > 0 && (
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
            isLoading ? (
              <Card>
                <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Chargement des données...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="generator">Générateur</TabsTrigger>
                  <TabsTrigger value="keywords">Mots-clés</TabsTrigger>
                  <TabsTrigger value="localities">Localités</TabsTrigger>
                </TabsList>
                
                <TabsContent value="generator">
                  <ContentGenerator {...contentGeneratorProps} />
                </TabsContent>
                
                <TabsContent value="keywords">
                  <KeywordsManager 
                    wordpressConfigId={selectedConfigId} 
                    categories={categories || []} 
                  />
                </TabsContent>
                
                <TabsContent value="localities">
                  <LocalitiesManager />
                </TabsContent>
              </Tabs>
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Aucune configuration WordPress</CardTitle>
                <CardDescription>
                  Veuillez sélectionner une configuration WordPress pour continuer
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {configs && configs.length === 0 
                    ? "Aucune configuration WordPress n'est disponible. Veuillez en créer une dans la section WordPress."
                    : "Veuillez sélectionner une configuration WordPress dans la liste déroulante ci-dessus."}
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
