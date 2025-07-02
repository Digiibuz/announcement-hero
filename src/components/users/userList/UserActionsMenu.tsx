
import React, { useState } from "react";
import { MoreHorizontal, Edit, Key, Trash2, UserCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserProfile } from "@/types/auth";
import SendCredentialsButton from "../SendCredentialsButton";
import UserEditForm from "../UserEditForm";

interface UserActionsMenuProps {
  user: UserProfile;
  onEdit?: () => void;
  onResetPassword: (email: string) => void;
  onDelete?: () => void;
  onUpdateUser?: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onImpersonateUser?: (user: UserProfile) => void;
  onDeleteClick?: (userId: string) => void;
  onImpersonate?: () => void;
  canImpersonate?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onEdit,
  onResetPassword,
  onDelete,
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser,
  onDeleteClick,
  onImpersonate,
  canImpersonate = true, // Par défaut à true pour les admins
  isUpdating = false,
  isDeleting = false
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleResetPassword = () => {
    onResetPassword(user.email);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setIsEditDialogOpen(true);
    }
  };

  const handleDelete = () => {
    if (onDeleteClick) {
      onDeleteClick(user.id);
    } else if (onDelete) {
      onDelete();
    }
  };

  const handleImpersonate = () => {
    if (onImpersonateUser) {
      onImpersonateUser(user);
    } else if (onImpersonate) {
      onImpersonate();
    }
  };

  // Détermine si on peut impersonner cet utilisateur (clients et commerciaux uniquement)
  const canImpersonateThisUser = canImpersonate && (user.role === 'client' || user.role === 'commercial');

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Bouton d'envoi des identifiants - visible directement */}
        <SendCredentialsButton user={user} variant="outline" size="sm" />
        
        {/* Menu dropdown pour les autres actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleResetPassword}>
              <Key className="mr-2 h-4 w-4" />
              Réinitialiser le mot de passe
            </DropdownMenuItem>
            
            {canImpersonateThisUser && (onImpersonateUser || onImpersonate) && (
              <DropdownMenuItem onClick={handleImpersonate}>
                <UserCheck className="mr-2 h-4 w-4" />
                Se connecter en tant que
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dialog d'édition de l'utilisateur */}
      {onUpdateUser && (
        <UserEditForm
          user={user}
          onUserUpdated={onUpdateUser}
          onDeleteUser={onDeleteUser}
          onResetPassword={onResetPassword}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          isDialogOpen={isEditDialogOpen}
          setIsDialogOpen={setIsEditDialogOpen}
        />
      )}
    </>
  );
};

export default UserActionsMenu;
