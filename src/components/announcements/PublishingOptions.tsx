
import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";
import { AnnouncementFormData } from "./AnnouncementForm";

interface PublishingOptionsProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const PublishingOptions = ({ form }: PublishingOptionsProps) => {
  const { categories, isLoading: isCategoriesLoading, error: categoriesError, hasCategories } = useWordPressCategories();
  const { canPublish, stats } = usePublicationLimits();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="wordpressCategory"
        render={({ field }) => (
          <FormItem>
            <Label>Catégorie</Label>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isCategoriesLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {isCategoriesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Chargement...</span>
                  </div>
                ) : categoriesError ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Erreur: {categoriesError}
                  </div>
                ) : hasCategories ? (
                  categories.map(category => (
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
              onValueChange={(value) => {
                // Si on essaie de sélectionner published ou scheduled mais que la limite est atteinte
                if ((value === 'published' || value === 'scheduled') && !canPublish()) {
                  return; // Ne pas changer la valeur
                }
                field.onChange(value);
              }}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem 
                  value="published" 
                  disabled={!canPublish()}
                  className={!canPublish() ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Publier immédiatement
                  {!canPublish() && " (Limite atteinte)"}
                </SelectItem>
                <SelectItem 
                  value="scheduled" 
                  disabled={!canPublish()}
                  className={!canPublish() ? "opacity-50 cursor-not-allowed" : ""}
                >
                  Planifier
                  {!canPublish() && " (Limite atteinte)"}
                </SelectItem>
              </SelectContent>
            </Select>
            {!canPublish() && (
              <p className="text-sm text-orange-600 mt-1">
                Limite de {stats.maxLimit} publications atteinte ce mois-ci
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch('status') === 'scheduled' && canPublish() && (
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
