
import React from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Clock, UserMinus } from "lucide-react";
import { UserProfile } from "@/types/auth";
import UserActionsMenu from "./UserActionsMenu";
import { UserListUtils } from "./UserListUtils";

interface UserTableDesktopProps {
  users: UserProfile[];
  isUpdating: boolean;
  isDeleting: boolean;
  onResetPassword: (email: string) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImpersonateUser: (user: UserProfile) => void;
  onDeleteClick: (userId: string) => void;
}

const UserTableDesktop: React.FC<UserTableDesktopProps> = ({
  users,
  isUpdating,
  isDeleting,
  onResetPassword,
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser,
  onDeleteClick
}) => {
  const { formatLastLogin, getWordPressConfigName, getRoleDisplayName, getRoleClass } = UserListUtils;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>WordPress</TableHead>
            <TableHead>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Dernière connexion
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </TableCell>
              <TableCell>{getWordPressConfigName(user)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatLastLogin(user.lastLogin)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <UserActionsMenu
                    user={user}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                    onResetPassword={onResetPassword}
                    onUpdateUser={onUpdateUser}
                    onDeleteUser={onDeleteUser}
                    onImpersonateUser={onImpersonateUser}
                  />
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDeleteClick(user.id)}
                    disabled={isDeleting}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTableDesktop;
