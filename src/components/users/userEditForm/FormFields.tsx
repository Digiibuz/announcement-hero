import React from "react";
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Role } from "@/types/auth";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Update the schema to use the Role type
export const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  role: z.custom<Role>(),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
  wpConfigIds: z.array(z.string()).optional(),
});

export type FormSchema = z.infer<typeof formSchema>;

interface FormFieldsProps {
  form: UseFormReturn<FormSchema>;
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
              <RadioGroup 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <RadioGroupItem value="admin">Administrateur</RadioGroupItem>
                  <RadioGroupItem value="client">Client</RadioGroupItem>
                </FormControl>
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Ajouter la sélection de configuration WordPress pour les clients */}
        {form.watch("role") === "client" && (
          <FormField
            control={form.control}
            name="wordpressConfigId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site WordPress</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un site WordPress" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Aucun site</SelectItem>
                    {configs.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name} ({config.site_url})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Site WordPress associé à ce client
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
