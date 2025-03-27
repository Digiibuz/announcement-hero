
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  role: z.enum(["admin", "editor"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface UserCreateFormProps {
  onUserCreated: () => void;
}

const UserCreateForm: React.FC<UserCreateFormProps> = ({ onUserCreated }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { configs } = useWordPressConfigs();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "editor",
      clientId: "",
      wordpressConfigId: "",
    },
  });

  // Reset the wordpressConfigId field when the role changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "role" && value.role === "admin") {
        form.setValue("wordpressConfigId", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: FormSchema) => {
    try {
      setIsSubmitting(true);
      setIsDialogOpen(false);
      
      const toastId = toast.loading("Création de l'utilisateur en cours...");
      
      console.log("Envoi des données:", values);
      
      // Appel de la fonction Edge avec une meilleure gestion des erreurs
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: values.email,
          name: values.name,
          password: values.password,
          role: values.role,
          clientId: values.role === "editor" ? values.clientId : null,
          wordpressConfigId: values.role === "editor" ? values.wordpressConfigId : null,
        },
      });
      
      if (error) {
        console.error("Erreur renvoyée par la fonction Edge:", error);
        throw new Error(error.message || "Erreur lors de la création de l'utilisateur");
      }
      
      console.log("Réponse de la fonction Edge:", data);
      
      if (!data || (data as any).error) {
        const errorMessage = (data as any)?.error || "Erreur lors de la création de l'utilisateur";
        throw new Error(errorMessage);
      }
      
      toast.dismiss(toastId);
      toast.success("Utilisateur créé avec succès");
      form.reset();
      onUserCreated();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error creating user:", error);
      
      // Message d'erreur plus détaillé pour aider au débogage
      let errorMessage = error.message || "Erreur lors de la création de l'utilisateur";
      
      // Si l'erreur contient des détails supplémentaires
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }
      
      // Ajouter le statut à l'erreur si disponible
      if (error.status) {
        errorMessage += ` (Status: ${error.status})`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un compte pour un nouveau client ou administrateur.
          </DialogDescription>
        </DialogHeader>
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

                {configs.length > 0 && (
                  <FormField
                    control={form.control}
                    name="wordpressConfigId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Configuration WordPress</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une configuration WordPress" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {configs.map((config) => (
                              <SelectItem key={config.id} value={config.id}>
                                {config.name} ({config.site_url})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Configuration WordPress attribuée à l'utilisateur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  "Créer l'utilisateur"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateForm;
