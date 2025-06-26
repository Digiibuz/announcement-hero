
import React from "react";
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

interface UserActionsMenuProps {
  user: UserProfile;
  onEdit: () => void;
  onResetPassword: (email: string) => void;
  onDelete: () => void;
  onImpersonate?: () => void;
  canImpersonate?: boolean;
}

const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onEdit,
  onResetPassword,
  onDelete,
  onImpersonate,
  canImpersonate = false
}) => {
  const handleResetPassword = () => {
    onResetPassword(user.email);
  };

  return (
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
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleResetPassword}>
            <Key className="mr-2 h-4 w-4" />
            Réinitialiser le mot de passe
          </DropdownMenuItem>
          
          {canImpersonate && onImpersonate && (
            <DropdownMenuItem onClick={onImpersonate}>
              <UserCheck className="mr-2 h-4 w-4" />
              Se connecter en tant que
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserActionsMenu;
