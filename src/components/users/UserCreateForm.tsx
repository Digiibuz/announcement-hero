
import React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import UserCreateFormDialog from "./userCreateForm/UserCreateFormDialog";
import { useUserCreateForm } from "./userCreateForm/useUserCreateForm";

interface UserCreateFormProps {
  onUserCreated: () => void;
}

const UserCreateForm: React.FC<UserCreateFormProps> = ({ onUserCreated }) => {
  const {
    form,
    isDialogOpen,
    setIsDialogOpen,
    isSubmitting,
    errorMessage,
    configs,
    commercials,
    onSubmit,
  } = useUserCreateForm(onUserCreated);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </DialogTrigger>
      <UserCreateFormDialog
        form={form}
        configs={configs}
        commercials={commercials}
        errorMessage={errorMessage}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
};

export default UserCreateForm;
