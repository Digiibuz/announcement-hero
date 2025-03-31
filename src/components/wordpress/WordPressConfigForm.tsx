
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { WordPressConfig } from "@/types/wordpress";

interface WordPressConfigFormProps {
  initialConfig?: Partial<WordPressConfig>;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

const WordPressConfigForm = ({
  initialConfig,
  onSubmit,
  isSubmitting = false,
}: WordPressConfigFormProps) => {
  // Définir les valeurs par défaut du formulaire
  const defaultValues = {
    name: initialConfig?.name || "",
    site_url: initialConfig?.site_url || "",
    app_username: initialConfig?.app_username || "",
    app_password: initialConfig?.app_password || "",
    prompt: initialConfig?.prompt || "",
  };

  const form = useForm({
    defaultValues,
  });

  const handleSubmit = (data: any) => {
    // Normaliser l'URL du site si elle ne se termine pas par un slash
    if (data.site_url && !data.site_url.endsWith('/')) {
      data.site_url = data.site_url + '/';
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input placeholder="Nom de la configuration" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="site_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL du site</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="app_username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom d'utilisateur (Application Password)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nom d'utilisateur pour Application Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="app_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe (Application Password)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mot de passe pour Application Password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description d'activité (Prompt)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez l'activité ou les services proposés (ex: plombier, électricien, etc.)"
                  className="resize-none min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialConfig?.id ? "Mise à jour..." : "Création..."}
            </>
          ) : initialConfig?.id ? (
            "Mettre à jour"
          ) : (
            "Créer"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default WordPressConfigForm;
