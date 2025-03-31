
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WordPressConfig } from "@/types/wordpress";
import { Pencil, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Le nom doit comporter au moins 2 caractères"),
  site_url: z.string().url("L'URL du site doit être valide"),
  app_username: z.string().optional(),
  app_password: z.string().optional(),
  prompt: z.string().optional(),
});

interface WordPressConfigFormProps {
  config?: WordPressConfig;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  trigger?: React.ReactNode;
}

const WordPressConfigForm = ({
  config,
  onSubmit,
  isSubmitting = false,
  buttonText = "Soumettre",
  dialogTitle = "Configuration WordPress",
  dialogDescription = "Entrez les informations de configuration WordPress.",
  trigger,
}: WordPressConfigFormProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: config?.name || "",
      site_url: config?.site_url || "",
      app_username: config?.app_username || "",
      app_password: config ? "unchanged" : "",
      prompt: config?.prompt || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Si le mot de passe n'a pas été modifié, on le supprime pour éviter de l'écraser
      if (config && values.app_password === "unchanged") {
        delete values.app_password;
      }

      await onSubmit(values);
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de la configuration" {...field} />
                  </FormControl>
                  <FormDescription>
                    Un nom pour identifier cette configuration
                  </FormDescription>
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
                  <FormDescription>
                    L'URL complète du site WordPress
                  </FormDescription>
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
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nom d'utilisateur pour l'authentification via Application Passwords
                  </FormDescription>
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
                      placeholder={config ? "••••••••" : "Mot de passe"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Mot de passe pour l'authentification via Application Passwords
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de l'activité du client" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Description détaillée de l'activité du client pour la génération de contenu Tom-E
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Chargement...
                  </>
                ) : (
                  buttonText
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WordPressConfigForm;
