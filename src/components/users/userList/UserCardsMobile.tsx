
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, BadgeCheck, Clock } from "lucide-react";
import { UserProfile } from "@/types/auth";
import UserActionsMenu from "./UserActionsMenu";
import { UserListUtils } from "./UserListUtils";

interface UserCardsMobileProps {
  users: UserProfile[];
  isUpdating: boolean;
  isDeleting: boolean;
  onResetPassword: (email: string) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImpersonateUser: (user: UserProfile) => void;
  onDeleteClick: (userId: string) => void;
}

const UserCardsMobile: React.FC<UserCardsMobileProps> = ({
  users,
  isUpdating,
  isDeleting,
  onResetPassword,
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser,
  onDeleteClick
}) => {
  const { formatLastPublication, getWordPressConfigName, getRoleDisplayName, getRoleClass } = UserListUtils;

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h3 className="font-medium">{user.name}</h3>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    {user.email}
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>

              <div className="flex items-center text-sm">
                <BadgeCheck className="h-4 w-4 mr-2 text-blue-500" />
                <span className="text-muted-foreground">WordPress:</span>
                <span className="ml-1">{getWordPressConfigName(user)}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Dernière publication:</span>
                <span className="ml-1">{formatLastPublication(user.lastLogin)}</span>
              </div>

              <div className="pt-2 flex justify-end">
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserCardsMobile;
