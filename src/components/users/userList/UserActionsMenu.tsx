
import React from "react";
import { UserProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { UserCog, Key, LogIn, MoreHorizontal } from "lucide-react";
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
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  isUpdating,
  isDeleting,
  onResetPassword,
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800 border shadow-lg z-50">
        <DropdownMenuItem asChild>
          <div className="w-full">
            <UserEditForm 
              user={user} 
              onUserUpdated={onUpdateUser}
              onDeleteUser={onDeleteUser}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onResetPassword(user.email)}
          className="cursor-pointer"
        >
          <Key className="h-4 w-4 mr-2" />
          Réinitialiser le mot de passe
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
  );
};

export default UserActionsMenu;
