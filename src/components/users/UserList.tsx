
import React, { useState } from "react";
import { UserProfile } from "@/types/auth";
import { useMediaQuery } from "@/hooks/use-media-query";
import UserTableDesktop from "./userList/UserTableDesktop";
import UserCardsMobile from "./userList/UserCardsMobile";
import DeleteConfirmationDialog from "./userList/DeleteConfirmationDialog";
import { EmptyState, LoadingState } from "./userList/EmptyAndLoadingStates";

interface UserListProps {
  users: UserProfile[];
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onResetPassword: (email: string) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImpersonateUser: (user: UserProfile) => void;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  isLoading,
  isDeleting,
  isUpdating,
  onResetPassword, 
  onUpdateUser,
  onDeleteUser,
  onImpersonateUser
}) => {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      await onDeleteUser(userToDelete);
      setConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (users.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
        {isMobile ? (
          <UserCardsMobile
            users={users}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            onResetPassword={onResetPassword}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onImpersonateUser={onImpersonateUser}
            onDeleteClick={handleDeleteClick}
          />
        ) : (
          <UserTableDesktop
            users={users}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
            onResetPassword={onResetPassword}
            onUpdateUser={onUpdateUser}
            onDeleteUser={onDeleteUser}
            onImpersonateUser={onImpersonateUser}
            onDeleteClick={handleDeleteClick}
          />
        )}
      </div>
      
      <DeleteConfirmationDialog
        isOpen={confirmOpen}
        isDeleting={isDeleting}
        onOpenChange={setConfirmOpen}
        onConfirmDelete={confirmDelete}
      />
    </>
  );
};

export default UserList;
