import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Search } from "lucide-react";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import { cn } from "@/lib/utils";
import SparklingStars from "@/components/ui/SparklingStars";
import "@/styles/sparkles.css";

interface SeoStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const SeoStep = ({ form, isMobile }: SeoStepProps) => {
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const [seoTitleLength, setSeoTitleLength] = useState(0);
  const [seoDescriptionLength, setSeoDescriptionLength] = useState(0);
  const [isHoveringSeoTitle, setIsHoveringSeoTitle] = useState(false);
  const [isHoveringSeoDescription, setIsHoveringSeoDescription] = useState(false);
  
  useEffect(() => {
    // Mettre à jour les compteurs de caractères lors de l'initialisation et des changements
    const seoTitle = form.getValues("seoTitle") || "";
    const seoDescription = form.getValues("seoDescription") || "";
    setSeoTitleLength(seoTitle.length);
    setSeoDescriptionLength(seoDescription.length);
    
    const subscription = form.watch((value) => {
      if (value.seoTitle !== undefined) {
        setSeoTitleLength(value.seoTitle.length);
      }
      if (value.seoDescription !== undefined) {
        setSeoDescriptionLength(value.seoDescription.length);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  const optimizeSeoContent = async (field: 'seoTitle' | 'seoDescription') => {
    try {
      const currentTitle = form.getValues('title');
      const currentDescription = form.getValues('description');
      
      if (!currentTitle || !currentDescription) {
        return;
      }
      
      const optimizedContent = await optimizeContent(field, currentTitle, currentDescription);
      
      if (optimizedContent) {
        form.setValue(field, optimizedContent);
        if (field === 'seoTitle') {
          setSeoTitleLength(optimizedContent.length);
        } else {
          setSeoDescriptionLength(optimizedContent.length);
        }
      }
    } catch (error: any) {
      console.error(`Error optimizing ${field}:`, error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-4 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <FormField 
            control={form.control} 
            name="seoTitle" 
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Titre SEO</FormLabel>
                  <div 
                    className="relative sparkle-container"
                    onMouseEnter={() => setIsHoveringSeoTitle(true)}
                    onMouseLeave={() => setIsHoveringSeoTitle(false)}
                  >
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 h-8 relative overflow-hidden transition-all duration-300 bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700"
                      onClick={() => optimizeSeoContent('seoTitle')} 
                      disabled={isOptimizing.seoTitle}
                    >
                      <SparklingStars isVisible={isHoveringSeoTitle && !isOptimizing.seoTitle} />
                      {isOptimizing.seoTitle ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">Optimisation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-white" />
                          <span className="text-xs text-white">Générer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <FormControl>
                  <div className="space-y-1">
                    <Input 
                      placeholder="Titre optimisé pour les moteurs de recherche" 
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        setSeoTitleLength(e.target.value.length);
                      }}
                    />
                    <div className="character-counter">
                      {seoTitleLength} caractères
                      {seoTitleLength < 30 && " (trop court)"}
                      {seoTitleLength > 60 && " (trop long)"}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Idéalement entre 50 et 60 caractères.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
          
          <FormField 
            control={form.control} 
            name="seoDescription" 
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Méta description</FormLabel>
                  <div 
                    className="relative sparkle-container"
                    onMouseEnter={() => setIsHoveringSeoDescription(true)}
                    onMouseLeave={() => setIsHoveringSeoDescription(false)}
                  >
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      className="flex items-center gap-1 h-8 relative overflow-hidden transition-all duration-300 bg-purple-600 text-white border-purple-600 hover:bg-purple-700 hover:border-purple-700"
                      onClick={() => optimizeSeoContent('seoDescription')} 
                      disabled={isOptimizing.seoDescription}
                    >
                      <SparklingStars isVisible={isHoveringSeoDescription && !isOptimizing.seoDescription} />
                      {isOptimizing.seoDescription ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span className="text-xs">Optimisation...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-white" />
                          <span className="text-xs text-white">Générer</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <FormControl>
                  <div className="space-y-1">
                    <Textarea 
                      placeholder="Description courte qui apparaîtra dans les résultats de recherche" 
                      className="resize-none min-h-[100px]" 
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        setSeoDescriptionLength(e.target.value.length);
                      }}
                    />
                    <div className="character-counter">
                      {seoDescriptionLength} caractères
                      {seoDescriptionLength < 120 && " (trop court)"}
                      {seoDescriptionLength > 158 && " (trop long)"}
                    </div>
                  </div>
                </FormControl>
                <FormDescription>
                  Idéalement entre 120 et 158 caractères.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
          
          <FormField 
            control={form.control} 
            name="seoSlug" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">yoursite.com/annonces/</span>
                    <Input 
                      placeholder="slug-de-url" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  L'URL qui sera utilisée pour accéder à cette annonce.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} 
          />
          
          <Card className="border border-muted mt-4 bg-muted/10">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Search className="h-4 w-4" />
                Aperçu dans Google
              </h3>
              <div className="text-blue-600 text-lg font-medium truncate">
                {form.getValues('seoTitle') || form.getValues('title') || "Titre de votre annonce"}
              </div>
              <div className="text-green-700 text-sm mb-1">
                yoursite.com/annonces/{form.getValues('seoSlug') || "url-de-lannonce"}
              </div>
              <div className="text-slate-700 text-sm line-clamp-2">
                {form.getValues('seoDescription') || "Ajoutez une méta description pour qu'elle apparaisse ici."}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoStep;
