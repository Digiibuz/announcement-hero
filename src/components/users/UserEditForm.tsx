import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, UserCog, UserMinus } from "lucide-react";
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
import {
  Checkbox
} from "@/components/ui/checkbox";
import { UserProfile } from "@/types/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  role: z.enum(["admin", "editor"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
  wpConfigIds: z.array(z.string()).optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface UserEditFormProps {
  user: UserProfile;
  onUserUpdated: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  isUpdating: boolean;
  isDeleting?: boolean;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ 
  user, 
  onUserUpdated,
  onDeleteUser,
  isUpdating,
  isDeleting = false
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);
  const { configs, clientConfigs, associateClientToConfig, removeClientConfigAssociation } = useWordPressConfigs();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      role: user.role || "editor",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: [],
    },
  });

  useEffect(() => {
    const fetchClientConfigurations = async () => {
      if (user.clientId && user.role === "editor") {
        setIsLoadingConfigs(true);
        try {
          const { data, error } = await supabase
            .from('client_wordpress_configs')
            .select('wordpress_config_id')
            .eq('client_id', user.clientId);
          
          if (error) {
            throw error;
          }
          
          const configIds = data.map(item => item.wordpress_config_id);
          setSelectedConfigIds(configIds);
          form.setValue("wpConfigIds", configIds);
        } catch (error) {
          console.error("Error fetching client WordPress configs:", error);
          toast.error("Erreur lors de la récupération des configurations WordPress du client");
        } finally {
          setIsLoadingConfigs(false);
        }
      }
    };
    
    fetchClientConfigurations();
  }, [user, form]);

  useEffect(() => {
    form.reset({
      email: user.email || "",
      name: user.name || "",
      role: user.role || "editor",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: selectedConfigIds,
    });
  }, [user, form, selectedConfigIds]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "role" && value.role === "admin") {
        form.setValue("wpConfigIds", []);
        form.setValue("wordpressConfigId", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (values: FormSchema) => {
    try {
      await onUserUpdated(user.id, {
        email: values.email,
        name: values.name,
        role: values.role,
        clientId: values.role === "editor" ? values.clientId : undefined,
        wordpressConfigId: values.role === "editor" ? values.wordpressConfigId : undefined
      });
      
      if (values.role === "editor" && values.clientId) {
        const newConfigIds = values.wpConfigIds || [];
        
        const associationsToRemove = clientConfigs
          .filter(cc => cc.client_id === values.clientId && !newConfigIds.includes(cc.wordpress_config_id));
        
        for (const assoc of associationsToRemove) {
          await removeClientConfigAssociation(assoc.id);
        }
        
        for (const configId of newConfigIds) {
          const existingAssoc = clientConfigs.find(
            cc => cc.client_id === values.clientId && cc.wordpress_config_id === configId
          );
          
          if (!existingAssoc) {
            await associateClientToConfig(values.clientId, configId);
          }
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (onDeleteUser) {
      try {
        await onDeleteUser(user.id);
        setConfirmDeleteOpen(false);
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserCog className="mr-2 h-4 w-4" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifier les informations de {user.name}
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
            
            <DialogFooter className="flex justify-between">
              <div className="flex items-center">
                {onDeleteUser && (
                  <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" type="button">
                        <UserMinus className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <UserMinus className="h-5 w-5 text-destructive mr-2" />
                          Confirmation de suppression
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={handleDeleteUser}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Suppression...
                            </>
                          ) : (
                            "Supprimer"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} type="button">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditForm;
