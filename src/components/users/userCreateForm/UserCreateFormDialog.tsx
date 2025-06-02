
import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import { FormSchema } from "./UserCreateFormFields";
import UserCreateFormFields from "./UserCreateFormFields";
import { WordPressConfig } from "@/types/wordpress";

interface UserCreateFormDialogProps {
  form: UseFormReturn<FormSchema>;
  configs: WordPressConfig[];
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: FormSchema) => Promise<void>;
}

const UserCreateFormDialog: React.FC<UserCreateFormDialogProps> = ({
  form,
  configs,
  errorMessage,
  isSubmitting,
  onSubmit
}) => {
  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
        <DialogDescription>
          Créez un compte pour un nouveau client, commercial ou administrateur.
        </DialogDescription>
      </DialogHeader>
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <UserCreateFormFields 
            form={form} 
            configs={configs} 
          />
          
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
  );
};

export default UserCreateFormDialog;
