
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { userCreateFormSchema, UserCreateFormValues } from "./userCreateForm/formSchema";
import { useUserCreateForm } from "./userCreateForm/useUserCreateForm";
import FormContent from "./userCreateForm/FormContent";

interface UserCreateFormProps {
  onUserCreated: () => void;
}

const UserCreateForm: React.FC<UserCreateFormProps> = ({ onUserCreated }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { configs } = useWordPressConfigs();

  const form = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateFormSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "client",
      wordpressConfigId: "",
    },
  });

  const { isSubmitting, onSubmit } = useUserCreateForm({ 
    form, 
    onUserCreated,
    onDialogClose: () => setIsDialogOpen(false),
  });

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
        <FormContent 
          form={form} 
          isSubmitting={isSubmitting} 
          onSubmit={onSubmit} 
          configs={configs}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UserCreateForm;
