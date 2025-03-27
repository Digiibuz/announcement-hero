
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { WordPressConfig } from "@/types/wordpress";

const wordpressConfigSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  site_url: z.string().url("L'URL doit être valide").min(1, "L'URL du site est requise"),
  rest_api_key: z.string().optional(),
  app_username: z.string().optional(),
  app_password: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

type WordPressConfigFormValues = z.infer<typeof wordpressConfigSchema>;

interface WordPressConfigFormProps {
  onSubmit: (data: WordPressConfigFormValues) => Promise<void>;
  defaultValues?: Partial<WordPressConfig>;
  buttonText?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  isSubmitting?: boolean;
  trigger?: React.ReactNode;
  config?: WordPressConfig;
}

const WordPressConfigForm: React.FC<WordPressConfigFormProps> = ({
  onSubmit,
  defaultValues = {},
  buttonText = "Ajouter",
  dialogTitle = "Ajouter une configuration WordPress",
  dialogDescription = "Entrez les détails de votre site WordPress",
  isSubmitting = false,
  trigger,
  config
}) => {
  const [open, setOpen] = React.useState(false);
  
  const form = useForm<WordPressConfigFormValues>({
    resolver: zodResolver(wordpressConfigSchema),
    defaultValues: {
      name: config?.name || defaultValues.name || "",
      site_url: config?.site_url || defaultValues.site_url || "",
      rest_api_key: config?.rest_api_key || defaultValues.rest_api_key || "",
      app_username: config?.app_username || defaultValues.app_username || "",
      app_password: config?.app_password || defaultValues.app_password || "",
      username: config?.username || defaultValues.username || "",
      password: config?.password || defaultValues.password || "",
    }
  });

  const handleSubmit = async (data: WordPressConfigFormValues) => {
    try {
      await onSubmit(data);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">{buttonText}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                placeholder="Mon site WordPress"
                className="col-span-3"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="col-span-4 text-sm text-red-500 text-right">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="site_url" className="text-right">
                URL du site
              </Label>
              <Input
                id="site_url"
                placeholder="https://monsite.com"
                className="col-span-3"
                {...form.register("site_url")}
              />
              {form.formState.errors.site_url && (
                <p className="col-span-4 text-sm text-red-500 text-right">
                  {form.formState.errors.site_url.message}
                </p>
              )}
            </div>

            <div className="my-2">
              <h3 className="text-sm font-medium mb-2">Méthode d'authentification</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Veuillez fournir au moins une méthode d'authentification. L'Application Password est recommandée.
              </p>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="app_username" className="text-right">
                Nom d'utilisateur (App)
              </Label>
              <Input
                id="app_username"
                placeholder="admin"
                className="col-span-3"
                {...form.register("app_username")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="app_password" className="text-right">
                Mot de passe (App)
              </Label>
              <Input
                id="app_password"
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                className="col-span-3"
                {...form.register("app_password")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rest_api_key" className="text-right">
                Clé API REST
              </Label>
              <Input
                id="rest_api_key"
                placeholder="Clé API WordPress"
                className="col-span-3"
                {...form.register("rest_api_key")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                placeholder="Nom d'utilisateur WordPress"
                className="col-span-3"
                {...form.register("username")}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mot de passe WordPress"
                className="col-span-3"
                {...form.register("password")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WordPressConfigForm;
