
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2, Send, Calendar, Eye, AlertCircle } from "lucide-react";
import { useTomEGenerator } from "@/hooks/useTomEGenerator";
import { DipiCptCategory } from "@/types/announcement";
import { Locality } from "@/types/wordpress";
import { CategoryKeyword } from "@/types/wordpress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContentGeneratorProps {
  wordpressConfigId: string;
  categories: DipiCptCategory[];
  localities: Locality[];
  keywords: CategoryKeyword[];
}

interface GeneratedContent {
  title: string;
  meta_description: string;
  h1: string;
  content: string;
  slug: string;
}

const ContentGenerator = ({
  wordpressConfigId,
  categories = [],
  localities = [],
  keywords = []
}: ContentGeneratorProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>("");
  const [selectedLocalityId, setSelectedLocalityId] = useState<string>("");
  const [publishStatus, setPublishStatus] = useState<"draft" | "publish" | "future">("draft");
  const [publishDate, setPublishDate] = useState<Date | undefined>(undefined);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState("settings");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { isGenerating, isPublishing, generateContent, publishToWordPress } = useTomEGenerator();

  // Filtrer les mots-clés par catégorie sélectionnée
  const filteredKeywords = selectedCategoryId 
    ? keywords.filter(k => k.category_id === selectedCategoryId)
    : [];

  // Récupérer les détails de la catégorie sélectionnée
  const selectedCategory = categories.find(c => c.id?.toString() === selectedCategoryId);
  const selectedKeyword = keywords.find(k => k.id === selectedKeywordId);
  const selectedLocality = localities.find(l => l.id === selectedLocalityId);

  const handleGenerate = async () => {
    if (!selectedCategoryId || !selectedKeywordId || !selectedLocalityId) {
      return;
    }

    try {
      setGenerationError(null);
      
      const content = await generateContent({
        configId: wordpressConfigId,
        category: selectedCategory?.name || "",
        categoryId: selectedCategoryId,
        keyword: selectedKeyword?.keyword || "",
        locality: selectedLocality?.name || ""
      });
      
      setGeneratedContent(content);
      setActiveTab("preview");
    } catch (error: any) {
      console.error("Erreur lors de la génération:", error);
      setGenerationError(error.message || "Une erreur s'est produite lors de la génération du contenu");
    }
  };

  const handlePublish = async () => {
    if (!generatedContent || !selectedCategoryId) {
      return;
    }

    try {
      // Formatter la date si nécessaire
      let formattedDate: string | undefined;
      if (publishStatus === 'future' && publishDate) {
        formattedDate = publishDate.toISOString();
      }

      await publishToWordPress({
        configId: wordpressConfigId,
        categoryId: selectedCategoryId,
        content: generatedContent,
        status: publishStatus,
        publishDate: formattedDate
      });
      
      // Réinitialiser après publication
      setGeneratedContent(null);
      setActiveTab("settings");
    } catch (error) {
      // Erreur déjà gérée dans le hook
      console.error("Erreur lors de la publication:", error);
    }
  };

  // Protect against empty arrays
  if (!categories.length || !localities.length || !keywords.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          <p>Données insuffisantes pour générer du contenu.</p>
          <p className="text-sm mt-2">
            Assurez-vous d'avoir configuré des catégories, des mots-clés et des localités.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Générateur de contenu Tom-E</CardTitle>
        <CardDescription>
          Générez et publiez du contenu SEO optimisé pour votre site WordPress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedContent}>
              Aperçu du contenu
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <div className="space-y-4">
              {generationError && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Erreur de génération</p>
                    <p className="text-sm">{generationError}</p>
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="category-select">Catégorie WordPress</Label>
                <Select 
                  value={selectedCategoryId} 
                  onValueChange={setSelectedCategoryId}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="category-select">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keyword-select">Mot-clé</Label>
                <Select 
                  value={selectedKeywordId} 
                  onValueChange={setSelectedKeywordId}
                  disabled={!selectedCategoryId || isGenerating || filteredKeywords.length === 0}
                >
                  <SelectTrigger id="keyword-select">
                    <SelectValue placeholder={
                      filteredKeywords.length === 0 
                        ? "Aucun mot-clé disponible" 
                        : "Sélectionner un mot-clé"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredKeywords.map(keyword => (
                      <SelectItem key={keyword.id} value={keyword.id}>
                        {keyword.keyword}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="locality-select">Localité</Label>
                <Select 
                  value={selectedLocalityId} 
                  onValueChange={setSelectedLocalityId}
                  disabled={isGenerating || localities.length === 0}
                >
                  <SelectTrigger id="locality-select">
                    <SelectValue placeholder={
                      localities.length === 0 
                        ? "Aucune localité disponible" 
                        : "Sélectionner une localité"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {localities.map(locality => (
                      <SelectItem key={locality.id} value={locality.id}>
                        {locality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!selectedCategoryId || !selectedKeywordId || !selectedLocalityId || isGenerating}
                className="w-full mt-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Générer du contenu
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            {generatedContent && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Titre</h3>
                  <div className="p-3 border rounded-md">{generatedContent.title}</div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Meta Description</h3>
                  <div className="p-3 border rounded-md">{generatedContent.meta_description}</div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Contenu</h3>
                  <div 
                    className="p-3 border rounded-md prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Options de publication</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="publish-status">Statut</Label>
                      <Select 
                        value={publishStatus} 
                        onValueChange={(value: "draft" | "publish" | "future") => setPublishStatus(value)}
                      >
                        <SelectTrigger id="publish-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="publish">Publier immédiatement</SelectItem>
                          <SelectItem value="future">Planifier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {publishStatus === "future" && (
                      <div>
                        <Label htmlFor="publish-date">Date de publication</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="publish-date"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !publishDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {publishDate ? (
                                format(publishDate, "PPP", { locale: fr })
                              ) : (
                                "Sélectionner une date"
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={publishDate}
                              onSelect={setPublishDate}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {generatedContent && activeTab === "preview" && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab("settings")}>
            Retour
          </Button>
          <Button 
            onClick={handlePublish} 
            disabled={isPublishing || (publishStatus === "future" && !publishDate)}
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publication en cours...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                {publishStatus === "draft" ? "Enregistrer en brouillon" : publishStatus === "future" ? "Planifier" : "Publier"}
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ContentGenerator;
