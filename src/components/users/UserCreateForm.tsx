
import React, { useState } from "react";
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
  role: z.enum(["admin", "client"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
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
      role: "client",
      wordpressConfigId: "",
    },
  });

  const onSubmit = async (values: FormSchema) => {
    try {
      setIsSubmitting(true);
      const toastId = toast.loading("Création de l'utilisateur en cours...");
      
      // Fermer le dialogue après la soumission
      setIsDialogOpen(false);
      
      // Préparer les données à envoyer
      const userData = {
        email: values.email,
        name: values.name,
        password: values.password,
        role: values.role,
        wordpressConfigId: values.role === "client" && values.wordpressConfigId ? values.wordpressConfigId : "",
      };
      
      console.log("Données envoyées pour création:", userData);
      
      // Appeler la fonction Edge
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: userData,
      });
      
      if (error) {
        console.error("Erreur lors de l'appel à la fonction:", error);
        toast.dismiss(toastId);
        toast.error(`Erreur: ${error.message || "Échec de la création de l'utilisateur"}`);
        return;
      }

      // Vérifier la réponse de la fonction Edge
      if (!data?.success) {
        console.error("Erreur retournée par la fonction:", data);
        const errorMessage = data?.error || "Erreur inconnue";
        const errorDetails = data?.details || "";
        
        toast.dismiss(toastId);
        toast.error(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`);
        return;
      }
      
      // Succès
      toast.dismiss(toastId);
      toast.success("Utilisateur créé avec succès");
      form.reset();
      onUserCreated();
    } catch (apiError: any) {
      console.error("Erreur d'API:", apiError);
      toast.error(`Erreur API: ${apiError.message || "Échec de la connexion à l'API"}`);
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
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* WordPress config selection only for clients */}
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
