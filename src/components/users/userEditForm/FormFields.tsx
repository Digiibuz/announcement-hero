
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/auth";
import { WordPressConfig } from "@/types/wordpress";

export const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  role: z.enum(["admin", "editor", "client"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
  wpConfigIds: z.array(z.string()).optional(),
});

export type FormSchema = z.infer<typeof formSchema>;

interface FormFieldsProps {
  form: ReturnType<typeof useForm<FormSchema>>;
  configs: WordPressConfig[];
  isLoadingConfigs: boolean;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (values: FormSchema) => void;
  selectedConfigIds?: string[];
}

const FormFields: React.FC<FormFieldsProps> = ({ 
  form, 
  configs, 
  isLoadingConfigs, 
  isUpdating, 
  onCancel,
  onSubmit,
  selectedConfigIds = [] 
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom d'utilisateur" {...field} />
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
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="editor">Éditeur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {form.watch("role") === "editor" && (
          <>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Client</FormLabel>
                  <FormControl>
                    <Input placeholder="client123" {...field} />
                  </FormControl>
                  <FormDescription>
                    Identifiant unique pour cet espace client
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wordpressConfigId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration WordPress</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une configuration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune configuration</SelectItem>
                      {configs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name} ({config.site_url})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Configuration WordPress principale de l'utilisateur
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {configs.length > 0 && (
              <FormField
                control={form.control}
                name="wpConfigIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Configurations WordPress additionnelles</FormLabel>
                      <FormDescription>
                        Sélectionnez les configurations WordPress à associer à ce client
                      </FormDescription>
                    </div>
                    {isLoadingConfigs ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Chargement des configurations...
                      </div>
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
                                className="flex flex-row items-start space-x-3 space-y-0 mb-2"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(config.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], config.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== config.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {config.name} ({config.site_url})
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} type="button">
            Annuler
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FormFields;
