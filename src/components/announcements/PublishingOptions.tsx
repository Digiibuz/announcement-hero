
"use client"

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";

interface PublishingOptionsProps {
  form: UseFormReturn<any>;
  formType?: "announcement" | "divipixel"; // Nouveau paramètre pour indiquer le type de formulaire
}

const PublishingOptions = ({ form, formType = "announcement" }: PublishingOptionsProps) => {
  const status = form.watch("status");
  
  // Utiliser le hook pour les catégories WordPress en précisant si c'est pour Divipixel
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    error: categoriesError 
  } = useWordPressCategories(formType === "divipixel");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options de publication</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-4 w-full sm:w-auto">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {/* Statut */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="scheduled">Planifié</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date de publication (visible seulement si statut = "scheduled") */}
            {status === "scheduled" && (
              <FormField
                control={form.control}
                name="publishDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date de publication</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP", {
                                locale: fr,
                              })
                            ) : (
                              <span>Choisir une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? date.toISOString() : null)}
                          locale={fr}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Catégorie WordPress (visible pour les statuts published et scheduled) */}
            {(status === "published" || status === "scheduled") && (
              <FormField
                control={form.control}
                name="wordpressCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {formType === "divipixel" 
                        ? "Catégorie Divipixel" 
                        : "Catégorie WordPress"}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isCategoriesLoading ? (
                          <SelectItem value="loading" disabled>Chargement...</SelectItem>
                        ) : categoriesError ? (
                          <SelectItem value="error" disabled>Erreur: impossible de charger les catégories</SelectItem>
                        ) : categories.length === 0 ? (
                          <SelectItem value="none" disabled>Aucune catégorie disponible</SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </TabsContent>
          
          <TabsContent value="seo" className="space-y-4">
            {/* SEO Title */}
            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre SEO</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Titre pour les moteurs de recherche" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* SEO Description */}
            <FormField
              control={form.control}
              name="seoDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description SEO</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Description pour les moteurs de recherche" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* SEO Slug */}
            <FormField
              control={form.control}
              name="seoSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="URL personnalisée (sans espaces ni caractères spéciaux)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PublishingOptions;
