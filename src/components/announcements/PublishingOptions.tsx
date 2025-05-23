
import React from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UseFormReturn } from "react-hook-form";
import { useWordPressCategories } from "@/hooks/wordpress/useWordPressCategories";
import { AnnouncementFormData } from "./AnnouncementForm";
import { NetworkAwareLoading } from "@/components/ui/network-aware-loading";

interface PublishingOptionsProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const PublishingOptions = ({ form }: PublishingOptionsProps) => {
  const { 
    categories, 
    isLoading: isCategoriesLoading, 
    error: categoriesError, 
    hasCategories,
    refetch 
  } = useWordPressCategories();
  
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
                <NetworkAwareLoading 
                  isLoading={isCategoriesLoading}
                  minDelay={100}
                  showSlowNetworkWarning={true}
                  slowNetworkMessage="Connexion lente détectée. Récupération des catégories optimisée en cours..."
                  loadingMessage="Chargement des catégories..."
                  variant="dots"
                  size={16}
                  className="py-3"
                >
                  {categoriesError ? (
                    <div className="p-3 text-center space-y-2">
                      <div className="flex items-center justify-center text-amber-500 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Erreur lors du chargement des catégories
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetch()}
                        className="text-xs"
                      >
                        Réessayer
                      </Button>
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
                </NetworkAwareLoading>
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
              defaultValue={field.value}
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
