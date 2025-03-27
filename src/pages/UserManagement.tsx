
import React, { useState } from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { User, UserPlus, Lock } from "lucide-react";

const UserManagement = () => {
  const { user, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Mock users data - would be fetched from Supabase in a real implementation
  const [users, setUsers] = useState([
    { id: "1", email: "client1@example.com", name: "Client 1", role: "editor", clientId: "client1" },
    { id: "3", email: "client2@example.com", name: "Client 2", role: "editor", clientId: "client2" },
  ]);

  const formSchema = z.object({
    email: z.string().email({ message: "Email invalide" }),
    name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
    role: z.enum(["admin", "editor"], { 
      required_error: "Veuillez sélectionner un rôle" 
    }),
    clientId: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "editor",
      clientId: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // This would be the Supabase call in the real implementation
      console.log("Creating user:", values);
      
      // Mock create user
      const newUser = {
        id: String(users.length + 1),
        email: values.email,
        name: values.name,
        role: values.role,
        clientId: values.clientId || `client${users.length + 1}`,
      };
      
      setUsers([...users, newUser]);
      setIsDialogOpen(false);
      form.reset();
      toast.success("Utilisateur créé avec succès");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Erreur lors de la création de l'utilisateur");
    }
  };

  const handleResetPassword = (userId: string) => {
    // Mock password reset
    console.log("Resetting password for user:", userId);
    toast.success("Un email de réinitialisation a été envoyé");
  };

  const handleImpersonateUser = (user: any) => {
    console.log("Impersonating user:", user);
    toast.success(`Vous êtes maintenant connecté en tant que ${user.name}`);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Sidebar />

        <main className="pt-16 md:pl-64">
          <div className="container px-4 py-8">
            <AnimatedContainer>
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">Accès restreint</h2>
                  <p className="mt-2 text-muted-foreground">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                  </p>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          <AnimatedContainer>
            <div className="max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
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
                        )}
                        
                        <DialogFooter>
                          <Button type="submit">Créer l'utilisateur</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Espace client</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "admin" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                          }`}>
                            {user.role === "admin" ? "Administrateur" : "Éditeur"}
                          </span>
                        </TableCell>
                        <TableCell>{user.clientId || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleResetPassword(user.id)}
                          >
                            Réinitialiser MDP
                          </Button>
                          {user.role === "editor" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleImpersonateUser(user)}
                            >
                              Se connecter en tant que
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
