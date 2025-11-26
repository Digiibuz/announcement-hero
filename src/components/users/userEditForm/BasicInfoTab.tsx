
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, UserMinus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import DeleteUserDialog from "./DeleteUserDialog";

interface BasicInfoTabProps {
  form: UseFormReturn<any>;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  onResetPassword?: () => void;
  onDeleteUser?: () => Promise<void>;
  isDeleting?: boolean;
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (open: boolean) => void;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  form,
  isUpdating,
  onCancel,
  onSubmit,
  onResetPassword,
  onDeleteUser,
  isDeleting = false,
  confirmDeleteOpen,
  setConfirmDeleteOpen
}) => {
  return (
    <div className="space-y-4">
      {/* Boutons d'action en haut */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
          {isUpdating ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="editor">Éditeur</SelectItem>
                          <SelectItem value="testeur">Testeur</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canPublishSocialMedia"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publication sur les réseaux sociaux</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Autoriser l'utilisateur à publier sur Facebook et Instagram
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions administratives */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Actions administratives</h4>
                
                <div className="flex gap-2">
                  {onResetPassword && (
                    <Button variant="outline" onClick={onResetPassword} className="flex-1">
                      <Key className="h-4 w-4 mr-2" />
                      Réinitialiser le mot de passe
                    </Button>
                  )}
                  
                  {onDeleteUser && (
                    <div className="flex-1">
                      <DeleteUserDialog 
                        isOpen={confirmDeleteOpen} 
                        isDeleting={isDeleting} 
                        onOpenChange={setConfirmDeleteOpen} 
                        onDelete={onDeleteUser} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>
    </div>
  );
};

export default BasicInfoTab;
