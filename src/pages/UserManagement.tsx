
import React from "react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import UserCreateForm from "@/components/users/UserCreateForm";
import UserList from "@/components/users/UserList";
import AccessDenied from "@/components/users/AccessDenied";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserProfile } from "@/types/auth";
import { TooltipProvider } from "@/components/ui/tooltip";

const UserManagement = () => {
  const { user, isAdmin, impersonateUser } = useAuth();
  const { 
    users, 
    isLoading, 
    isDeleting,
    isUpdating,
    fetchUsers, 
    handleResetPassword,
    updateUser,
    deleteUser
  } = useUserManagement();
  
  const handleImpersonateUser = (userToImpersonate: UserProfile) => {
    impersonateUser(userToImpersonate);
    toast.success(`Vous êtes maintenant connecté en tant que ${userToImpersonate.name}`);
  };

  const titleAction = isAdmin ? (
    <UserCreateForm onUserCreated={fetchUsers} />
  ) : null;

  return (
    <TooltipProvider>
      <PageLayout title="Gestion des utilisateurs" titleAction={titleAction} containerClassName="max-w-full">
        {!isAdmin ? (
          <AccessDenied />
        ) : (
          <AnimatedContainer delay={200} className="w-full">
            <UserList 
              users={users}
              isLoading={isLoading}
              isDeleting={isDeleting}
              isUpdating={isUpdating}
              onResetPassword={handleResetPassword}
              onImpersonateUser={handleImpersonateUser}
              onUpdateUser={updateUser}
              onDeleteUser={deleteUser}
            />
          </AnimatedContainer>
        )}
      </PageLayout>
    </TooltipProvider>
  );
};

export default UserManagement;
