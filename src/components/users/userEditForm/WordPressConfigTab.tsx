
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { WordPressConfig } from "@/types/wordpress";

interface WordPressConfigTabProps {
  form: UseFormReturn<any>;
  configs: WordPressConfig[];
  isLoadingConfigs: boolean;
  selectedConfigIds: string[];
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
}

const WordPressConfigTab: React.FC<WordPressConfigTabProps> = ({
  form,
  configs,
  isLoadingConfigs,
  selectedConfigIds,
  isUpdating,
  onCancel,
  onSubmit
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="wpConfigIds"
          render={() => (
            <FormItem>
              <FormLabel>Configurations WordPress</FormLabel>
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {isLoadingConfigs ? (
                  <div className="text-sm text-muted-foreground">Chargement des configurations...</div>
                ) : configs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Aucune configuration disponible</div>
                ) : (
                  configs.map((config) => (
                    <FormField
                      key={config.id}
                      control={form.control}
                      name="wpConfigIds"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={config.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(config.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, config.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: string) => value !== config.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium">
                                {config.name}
                              </FormLabel>
                              <p className="text-xs text-muted-foreground">
                                {config.site_url}
                              </p>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  ))
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default WordPressConfigTab;
