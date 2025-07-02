
import React from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Clock } from "lucide-react";
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
    <div className="bg-white rounded-lg overflow-hidden">
      <Table className="bg-white">
        <TableHeader className="bg-gray-50">
          <TableRow className="border-b border-gray-200">
            <TableHead className="text-gray-700">Nom</TableHead>
            <TableHead className="text-gray-700">Email</TableHead>
            <TableHead className="text-gray-700">Rôle</TableHead>
            <TableHead className="text-gray-700">WordPress</TableHead>
            <TableHead className="text-gray-700">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Dernière connexion
              </div>
            </TableHead>
            <TableHead className="text-right text-gray-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {users.map((user) => (
            <TableRow 
              key={user.id} 
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
              <TableCell className="text-gray-700">{user.email}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </TableCell>
              <TableCell className="text-gray-700">{getWordPressConfigName(user)}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatLastLogin(user.lastLogin)}
              </TableCell>
              <TableCell className="text-right">
                <UserActionsMenu
                  user={user}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                  onResetPassword={onResetPassword}
                  onUpdateUser={onUpdateUser}
                  onDeleteUser={onDeleteUser}
                  onImpersonateUser={onImpersonateUser}
                  onDeleteClick={onDeleteClick}
                  canImpersonate={true}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTableDesktop;
