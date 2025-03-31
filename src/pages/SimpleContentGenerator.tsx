
import React, { useState } from "react";
import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Save, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSimpleContentGenerator } from "@/hooks/useSimpleContentGenerator";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useAuth } from "@/context/AuthContext";

const SimpleContentGenerator = () => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetLength, setTargetLength] = useState(500);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [contentStatus, setContentStatus] = useState<'draft' | 'publish'>('draft');
  
  const { categories, isLoading: categoriesLoading } = useWordPressCategories(user?.id, user?.wordpressConfigId);
  
  const { 
    generateContent, 
    publishToWordPress, 
    isGenerating, 
    isPublishing, 
    generatedContent,
    clearContent
  } = useSimpleContentGenerator();

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    await generateContent({
      topic: topic.trim(),
      keywords: keywords.trim(),
      targetLength: targetLength
    });
  };

  const handlePublish = async () => {
    if (!generatedContent || !selectedCategory) return;
    
    await publishToWordPress(
      generatedContent,
      selectedCategory,
      contentStatus
    );
  };

  const handleReset = () => {
    clearContent();
    setTopic("");
    setKeywords("");
    setSelectedCategory("");
    setContentStatus('draft');
  };

  return (
    <PageLayout title="Générateur de Contenu Simple">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Générer du contenu</CardTitle>
            <CardDescription>
              Entrez un sujet et des mots-clés pour générer automatiquement du contenu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Sujet</Label>
                <Input
                  id="topic"
                  placeholder="Ex: Les avantages du marketing digital"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Mots-clés (séparés par des virgules)</Label>
                <Input
                  id="keywords"
                  placeholder="Ex: SEO, marketing, digital, stratégie"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetLength">Longueur approximative (mots)</Label>
                <Select 
                  onValueChange={value => setTargetLength(Number(value))} 
                  defaultValue="500"
                  disabled={isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une longueur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Court (~300 mots)</SelectItem>
                    <SelectItem value="500">Moyen (~500 mots)</SelectItem>
                    <SelectItem value="800">Long (~800 mots)</SelectItem>
                    <SelectItem value="1200">Très long (~1200 mots)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={!topic.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Générer le contenu
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contenu généré</CardTitle>
            <CardDescription>
              Prévisualisez et publiez le contenu généré sur WordPress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {generatedContent.title}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Méta description</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    {generatedContent.metaDescription}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Contenu</Label>
                  <div className="p-3 bg-muted rounded-md h-[220px] overflow-y-auto whitespace-pre-line">
                    {generatedContent.content}
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie WordPress</Label>
                    <Select 
                      onValueChange={setSelectedCategory} 
                      value={selectedCategory}
                      disabled={isPublishing || categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories && categories.map(category => (
                          <SelectItem key={category.id.toString()} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut de publication</Label>
                    <Select 
                      onValueChange={(value) => setContentStatus(value as 'draft' | 'publish')} 
                      value={contentStatus}
                      disabled={isPublishing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="publish">Publier immédiatement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleReset}
                      disabled={isPublishing}
                    >
                      Réinitialiser
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={handlePublish}
                      disabled={!selectedCategory || isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publication...
                        </>
                      ) : contentStatus === 'draft' ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Publier
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[450px] text-muted-foreground text-center">
                <div>
                  <p>Aucun contenu généré</p>
                  <p className="text-sm mt-2">Utilisez le formulaire pour générer du contenu</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SimpleContentGenerator;
