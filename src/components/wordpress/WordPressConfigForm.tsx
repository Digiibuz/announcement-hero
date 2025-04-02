
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface WordPressConfigFormProps {
  initialConfig?: Partial<WordPressConfig>;
  config?: WordPressConfig; // Add config prop as an alternative to initialConfig
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  trigger?: React.ReactNode;
}

const WordPressConfigForm = ({
  initialConfig,
  config, // Add this prop
  onSubmit,
  isSubmitting = false,
  buttonText, // Make it optional
  dialogTitle,
  dialogDescription,
  trigger,
}: WordPressConfigFormProps) => {
  // Use config if provided, otherwise use initialConfig
  const configToUse = config || initialConfig || {};
  
  // Define the values for the form
  const defaultValues = {
    name: configToUse.name || "",
    site_url: configToUse.site_url || "",
    app_username: configToUse.app_username || "",
    app_password: configToUse.app_password || "",
    prompt: configToUse.prompt || "",
  };

  const form = useForm({
    defaultValues,
  });

  const handleSubmit = (data: any) => {
    // Normalize the URL of the site if it doesn't end with a slash
    if (data.site_url && !data.site_url.endsWith('/')) {
      data.site_url = data.site_url + '/';
    }
    onSubmit(data);
  };

  // If trigger is provided, render the dialog with the form
  if (trigger) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialogTitle || "Configuration WordPress"}</DialogTitle>
            {dialogDescription && <DialogDescription>{dialogDescription}</DialogDescription>}
          </DialogHeader>
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
                    {configToUse.id ? "Mise à jour..." : "Création..."}
                  </>
                ) : (
                  buttonText || (configToUse.id ? "Mettre à jour" : "Créer")
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // If trigger is not provided, render just the form
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
              {configToUse.id ? "Mise à jour..." : "Création..."}
            </>
          ) : (
            buttonText || (configToUse.id ? "Mettre à jour" : "Créer")
          )}
        </Button>
      </form>
    </Form>
  );
};

export default WordPressConfigForm;
