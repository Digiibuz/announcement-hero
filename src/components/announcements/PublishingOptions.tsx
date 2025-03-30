
import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { useDiviPixelCategories } from "@/hooks/wordpress/useDiviPixelCategories";
import { AnnouncementFormData } from "./AnnouncementForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PublishingOptionsProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const PublishingOptions = ({ form }: PublishingOptionsProps) => {
  const [contentType, setContentType] = useState<"post" | "page">(
    form.getValues("wordpressContentType") || "post"
  );
  
  // Post categories (standard WordPress categories)
  const { 
    categories: postCategories, 
    isLoading: isPostCategoriesLoading, 
    error: postCategoriesError, 
    hasCategories: hasPostCategories 
  } = useWordPressCategories();
  
  // Page categories (DiviPixel categories)
  const { 
    categories: pageCategories, 
    isLoading: isPageCategoriesLoading, 
    error: pageCategoriesError, 
    hasCategories: hasPageCategories 
  } = useDiviPixelCategories();
  
  // Set the content type in the form when it changes
  useEffect(() => {
    form.setValue("wordpressContentType", contentType);
    
    // Reset category when changing content type
    form.setValue("wordpressCategory", "");
  }, [contentType, form]);
  
  // Current categories and loading state based on selected content type
  const currentCategories = contentType === "post" ? postCategories : pageCategories;
  const isCurrentCategoriesLoading = contentType === "post" ? isPostCategoriesLoading : isPageCategoriesLoading;
  const currentCategoriesError = contentType === "post" ? postCategoriesError : pageCategoriesError;
  const hasCurrentCategories = contentType === "post" ? hasPostCategories : hasPageCategories;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="wordpressContentType"
        render={({ field }) => (
          <FormItem>
            <Label>Type de contenu WordPress</Label>
            <Tabs 
              defaultValue={contentType} 
              onValueChange={(value) => setContentType(value as "post" | "page")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="post" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Article
                </TabsTrigger>
                <TabsTrigger value="page" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Page
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <FormDescription>
              Choisissez si vous souhaitez publier un article ou une page WordPress
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="wordpressCategory"
        render={({ field }) => (
          <FormItem>
            <Label>Catégorie {contentType === "post" ? "d'article" : "de page"}</Label>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isCurrentCategoriesLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={`Sélectionnez une catégorie ${contentType === "post" ? "d'article" : "de page"}`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isCurrentCategoriesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Chargement...</span>
                  </div>
                ) : currentCategoriesError ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Erreur: {currentCategoriesError}
                  </div>
                ) : hasCurrentCategories ? (
                  currentCategories.map(category => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Aucune catégorie disponible
                  </div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <Label>Statut de publication</Label>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publier immédiatement</SelectItem>
                <SelectItem value="scheduled">Planifier</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch('status') === 'scheduled' && (
        <FormField
          control={form.control}
          name="publishDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Label>Date de publication</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        "Sélectionnez une date"
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default PublishingOptions;
