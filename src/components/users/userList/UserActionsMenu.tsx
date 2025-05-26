
import React, { useState } from "react";
import { UserProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { UserCog, LogIn, MoreHorizontal, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserEditForm from "../UserEditForm";

interface UserActionsMenuProps {
  user: UserProfile;
  isUpdating: boolean;
  isDeleting: boolean;
  onResetPassword: (email: string) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImpersonateUser: (user: UserProfile) => void;
  onDeleteClick: (userId: string) => void;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  isUpdating,
  isDeleting,
  onResetPassword,
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser,
  onDeleteClick
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = () => {
    onDeleteClick(user.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ouvrir le menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 bg-white dark:bg-gray-800 border shadow-lg z-50">
          <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
            <UserCog className="h-4 w-4 mr-2" />
            Modifier l'utilisateur
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleDeleteClick}
            className="cursor-pointer text-red-600 focus:text-red-600"
            disabled={isDeleting}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
          
          {user.role === 'client' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onImpersonateUser(user)}
                className="cursor-pointer"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter en tant que
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
};

export default UserActionsMenu;
