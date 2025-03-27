
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WordPressConfig } from "@/types/wordpress";

const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  site_url: z.string().url({ message: "URL invalide" }),
  rest_api_key: z.string().min(5, { message: "La clé API REST doit contenir au moins 5 caractères" }),
  username: z.string().optional(),
  password: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface WordPressConfigFormProps {
  config?: WordPressConfig;
  onSubmit: (data: FormSchema) => Promise<void>;
  buttonText: string;
  dialogTitle: string;
  dialogDescription: string;
  isSubmitting: boolean;
  trigger?: React.ReactNode;
}

const WordPressConfigForm: React.FC<WordPressConfigFormProps> = ({
  config,
  onSubmit,
  buttonText,
  dialogTitle,
  dialogDescription,
  isSubmitting,
  trigger
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: config?.name || "",
      site_url: config?.site_url || "",
      rest_api_key: config?.rest_api_key || "",
      username: config?.username || "",
      password: config?.password || "",
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        name: config.name,
        site_url: config.site_url,
        rest_api_key: config.rest_api_key,
        username: config.username || "",
        password: config.password || "",
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: FormSchema) => {
    try {
      await onSubmit(values);
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
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
                    <Input placeholder="Mon site WordPress" {...field} />
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
              name="rest_api_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clé API REST</FormLabel>
                  <FormControl>
                    <Input placeholder="clé-api-rest" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="admin" {...field} value={field.value || ""} />
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
                  <FormLabel>Mot de passe (optionnel)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
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
