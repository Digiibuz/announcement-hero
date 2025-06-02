
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RotateCcw } from "lucide-react";
import DeleteUserDialog from "./DeleteUserDialog";

interface BasicInfoTabProps {
  form: UseFormReturn<any>;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  onResetPassword?: () => void;
  onDeleteUser?: () => void;
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <SelectItem value="editor">Éditeur</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 pt-4">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
          
          <div className="flex justify-between pt-2 border-t">
            {onResetPassword && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onResetPassword}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser le mot de passe
              </Button>
            )}
            
            {onDeleteUser && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Suppression..." : "Supprimer l'utilisateur"}
              </Button>
            )}
          </div>
        </div>
      </form>

      <DeleteUserDialog 
        isOpen={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onDelete={onDeleteUser ? async () => { onDeleteUser(); } : async () => { return Promise.resolve(); }}
        isDeleting={isDeleting}
      />
    </Form>
  );
};

export default BasicInfoTab;
