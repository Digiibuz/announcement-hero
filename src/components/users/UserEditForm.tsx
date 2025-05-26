
import React from "react";
import { UserCog, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/types/auth";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useUserEditForm } from "./userEditForm/useUserEditForm";
import DeleteUserDialog from "./userEditForm/DeleteUserDialog";
import FormFields from "./userEditForm/FormFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserEditFormProps {
  user: UserProfile;
  onUserUpdated: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onResetPassword?: (email: string) => void;
  isUpdating: boolean;
  isDeleting?: boolean;
  isDialogOpen?: boolean;
  setIsDialogOpen?: (open: boolean) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ 
  user, 
  onUserUpdated,
  onDeleteUser,
  onResetPassword,
  isUpdating,
  isDeleting = false,
  isDialogOpen: externalIsDialogOpen,
  setIsDialogOpen: externalSetIsDialogOpen
}) => {
  const { configs, clientConfigs, associateClientToConfig, removeClientConfigAssociation } = useWordPressConfigs();
  
  const {
    form,
    isDialogOpen: internalIsDialogOpen,
    setIsDialogOpen: internalSetIsDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    isLoadingConfigs,
    selectedConfigIds,
    handleSubmit,
    handleDeleteUser
  } = useUserEditForm(user, async (userId, userData) => {
    await onUserUpdated(userId, userData);
    
    if (userData.role === "client" && userData.clientId) {
      const newConfigIds = form.getValues("wpConfigIds") || [];
      
      const associationsToRemove = clientConfigs
        .filter(cc => cc.client_id === userData.clientId && !newConfigIds.includes(cc.wordpress_config_id));
      
      for (const assoc of associationsToRemove) {
        await removeClientConfigAssociation(assoc.id);
      }
      
      for (const configId of newConfigIds) {
        const existingAssoc = clientConfigs.find(
          cc => cc.client_id === userData.clientId && cc.wordpress_config_id === configId
        );
        
        if (!existingAssoc) {
          await associateClientToConfig(userData.clientId, configId);
        }
      }
    }
  }, onDeleteUser);

  // Use external state if provided, otherwise use internal state
  const isDialogOpen = externalIsDialogOpen !== undefined ? externalIsDialogOpen : internalIsDialogOpen;
  const setIsDialogOpen = externalSetIsDialogOpen !== undefined ? externalSetIsDialogOpen : internalSetIsDialogOpen;

  const handleResetPasswordClick = () => {
    if (onResetPassword) {
      onResetPassword(user.email);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {!externalIsDialogOpen && (
        <DialogTrigger asChild>
          <div className="w-full">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <UserCog className="h-4 w-4 mr-2" />
              Modifier l'utilisateur
            </Button>
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifier les informations de {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <FormFields 
            form={form}
            configs={configs}
            isLoadingConfigs={isLoadingConfigs}
            isUpdating={isUpdating}
            onCancel={() => setIsDialogOpen(false)}
            onSubmit={handleSubmit}
            selectedConfigIds={selectedConfigIds}
          />
          
          <div className="flex flex-col gap-3 pt-4 border-t">
            {onResetPassword && (
              <Button 
                variant="outline" 
                onClick={handleResetPasswordClick}
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Réinitialiser le mot de passe
              </Button>
            )}
            
            {onDeleteUser && (
              <DeleteUserDialog
                isOpen={confirmDeleteOpen}
                isDeleting={isDeleting}
                onOpenChange={setConfirmDeleteOpen}
                onDelete={handleDeleteUser}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditForm;
