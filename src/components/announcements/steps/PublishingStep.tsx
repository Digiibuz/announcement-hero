
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AnnouncementFormData } from "../AnnouncementForm";
import { UseFormReturn } from "react-hook-form";
import { usePublicationLimits } from "@/hooks/usePublicationLimits";

interface PublishingStepProps {
  form: UseFormReturn<AnnouncementFormData>;
  isMobile?: boolean;
}

const PublishingStep = ({
  form,
  isMobile
}: PublishingStepProps) => {
  const { canPublish, stats } = usePublicationLimits();
  
  const getCardStyles = () => {
    if (isMobile) {
      return "border-0 border-b border-border shadow-none rounded-none bg-transparent mb-3 last:border-b-0 last:mb-0";
    }
    return "border shadow-sm";
  };

  // Calculer la date de remise à zéro (1er du mois suivant)
  const getResetDate = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return format(nextMonth, "dd/MM/yyyy");
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card className={getCardStyles()}>
        <CardContent className={`space-y-4 ${isMobile ? "px-0 py-4" : "p-6"}`}>
          <FormField 
            control={form.control} 
            name="status" 
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut de publication</FormLabel>
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
                <FormDescription>
                  {!canPublish() ? (
                    <span className="text-orange-600">
                      Limite de {stats.maxLimit} publications atteinte ce mois-ci. 
                      Remise à zéro le {getResetDate()}. 
                      Seuls les brouillons peuvent être enregistrés.
                    </span>
                  ) : (
                    "Les brouillons peuvent être enregistrés maintenant et finalisés plus tard. Utilisez le bouton \"Enregistrer brouillon\" en bas de page."
                  )}
                </FormDescription>
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
                  <FormLabel>Date de publication</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button 
                          variant="outline" 
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : "Sélectionnez une date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={field.value} 
                        onSelect={field.onChange} 
                        disabled={date => date < new Date()} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingStep;
