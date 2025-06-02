
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserProfile } from "@/types/auth";
import { WordPressConfig } from "@/types/wordpress";
import PublicationLimitsField from "./PublicationLimitsField";

interface FormFieldsProps {
  form: UseFormReturn<any>;
  configs: WordPressConfig[];
  isLoadingConfigs: boolean;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  selectedConfigIds: string[];
  user?: UserProfile;
}

const FormFields: React.FC<FormFieldsProps> = ({
  form,
  configs,
  isLoadingConfigs,
  isUpdating,
  onCancel,
  onSubmit,
  selectedConfigIds,
  user
}) => {
  const role = form.watch("role");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="editor">Éditeur</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === "client" && (
          <FormField
            control={form.control}
            name="wpConfigIds"
            render={() => (
              <FormItem>
                <FormLabel>Configurations WordPress</FormLabel>
                <div className="space-y-2">
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
                              className="flex flex-row items-start space-x-3 space-y-0"
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
                              <FormLabel className="text-sm font-normal">
                                {config.name} ({config.site_url})
                              </FormLabel>
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
        )}

        {/* Publication Limits Section for Client Users */}
        {user && role === "client" && (
          <PublicationLimitsField 
            user={user} 
            isUpdating={isUpdating}
          />
        )}

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

export default FormFields;
