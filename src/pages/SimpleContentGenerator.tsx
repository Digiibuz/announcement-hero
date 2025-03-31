
import React, { useState } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, SendHorizonal, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSimpleContentGenerator } from "@/hooks/useSimpleContentGenerator";
import { Slider } from "@/components/ui/slider";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AccessDenied from "@/components/users/AccessDenied";

const SimpleContentGenerator = () => {
  const { isAdmin, isClient } = useAuth();
  const hasAccess = isAdmin || isClient;
  
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetLength, setTargetLength] = useState(500);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft');
  const [activeTab, setActiveTab] = useState("editor");
  
  const { 
    isGenerating, 
    isPublishing, 
    generatedContent, 
    generateContent, 
    publishToWordPress, 
    clearContent 
  } = useSimpleContentGenerator();
  
  const { categories, isLoading: isLoadingCategories } = useWordPressCategories();
  
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Veuillez entrer un sujet");
      return;
    }
    
    const result = await generateContent({
      topic: topic.trim(),
      keywords: keywords.trim(),
      targetLength
    });
    
    if (result) {
      setActiveTab("preview");
    }
  };
  
  const handlePublish = async () => {
    if (!generatedContent || !selectedCategoryId) {
      toast.error("Veuillez générer du contenu et sélectionner une catégorie");
      return;
    }
    
    await publishToWordPress(generatedContent, selectedCategoryId, publishStatus);
    clearContent();
    setActiveTab("editor");
  };
  
  if (!hasAccess) {
    return (
      <PageLayout title="Générateur de contenu simple">
        <AccessDenied />
      </PageLayout>
    );
  }
  
  return (
    <PageLayout 
      title="Générateur de contenu simple" 
      description="Générez facilement du contenu optimisé pour le SEO et publiez-le sur WordPress"
    >
      <AnimatedContainer delay={200}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="editor">Éditeur</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedContent}>Aperçu</TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor">
            <Card>
              <CardHeader>
                <CardTitle>Générer du contenu</CardTitle>
                <CardDescription>
                  Entrez un sujet et des mots-clés pour générer du contenu optimisé
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Sujet principal</Label>
                  <Input
                    id="topic"
                    placeholder="Par exemple: Rénovation de salle de bain"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                  <Input
                    id="keywords"
                    placeholder="Par exemple: rénovation, salle de bain, moderne, budget"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="length">Longueur du contenu</Label>
                    <span className="text-sm text-muted-foreground">{targetLength} mots</span>
                  </div>
                  <Slider
                    id="length"
                    min={300}
                    max={1500}
                    step={100}
                    value={[targetLength]}
                    onValueChange={(value) => setTargetLength(value[0])}
                    disabled={isGenerating}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerate} 
                  disabled={!topic.trim() || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Générer le contenu
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview">
            {generatedContent && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contenu généré</CardTitle>
                    <CardDescription>
                      Prévisualisez le contenu généré avant de le publier
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preview-title">Titre</Label>
                      <div id="preview-title" className="p-3 border rounded-md">
                        {generatedContent.title}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preview-meta">Meta description</Label>
                      <div id="preview-meta" className="p-3 border rounded-md text-sm">
                        {generatedContent.metaDescription}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preview-content">Contenu</Label>
                      <div 
                        id="preview-content" 
                        className="p-3 border rounded-md prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Options de publication</CardTitle>
                    <CardDescription>
                      Choisissez où et comment publier ce contenu
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Catégorie WordPress</Label>
                      <Select 
                        value={selectedCategoryId} 
                        onValueChange={setSelectedCategoryId}
                        disabled={isPublishing || isLoadingCategories}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Sélectionner une catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCategories ? (
                            <SelectItem value="loading" disabled>Chargement...</SelectItem>
                          ) : categories?.length === 0 ? (
                            <SelectItem value="none" disabled>Aucune catégorie disponible</SelectItem>
                          ) : (
                            categories?.map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut de publication</Label>
                      <Select 
                        value={publishStatus} 
                        onValueChange={(value: 'draft' | 'publish') => setPublishStatus(value)}
                        disabled={isPublishing}
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Choisir un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="publish">Publier immédiatement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("editor")}
                      disabled={isPublishing}
                    >
                      Retour à l'éditeur
                    </Button>
                    
                    <Button 
                      onClick={handlePublish} 
                      disabled={!selectedCategoryId || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publication en cours...
                        </>
                      ) : publishStatus === 'draft' ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer en brouillon
                        </>
                      ) : (
                        <>
                          <SendHorizonal className="mr-2 h-4 w-4" />
                          Publier maintenant
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </AnimatedContainer>
    </PageLayout>
  );
};

export default SimpleContentGenerator;
