
import React from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { WordPressConfig } from "@/types/wordpress";
import { UserProfile } from "@/types/auth";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Re-using the schema from the parent component
export const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  role: z.enum(["admin", "client", "commercial"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  wordpressConfigId: z.string().optional(),
  commercialId: z.string().optional(),
});

export type FormSchema = z.infer<typeof formSchema>;

interface UserCreateFormFieldsProps {
  form: UseFormReturn<FormSchema>;
  configs: WordPressConfig[];
  commercials?: UserProfile[];
}

const UserCreateFormFields: React.FC<UserCreateFormFieldsProps> = ({ 
  form, 
  configs,
  commercials = []
}) => {
  const selectedRole = form.watch("role");

  return (
    <div className="space-y-4">
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
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mot de passe</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
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
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* WordPress config selection only for clients */}
      {selectedRole === "client" && (
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

      {/* Commercial assignment for clients */}
      {selectedRole === "client" && commercials.length > 0 && (
        <FormField
          control={form.control}
          name="commercialId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Commercial assigné</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un commercial" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucun commercial</SelectItem>
                  {commercials.map((commercial) => (
                    <SelectItem key={commercial.id} value={commercial.id}>
                      {commercial.name} ({commercial.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Commercial responsable de ce client
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};

export default UserCreateFormFields;
