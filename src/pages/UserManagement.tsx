
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
import { useMediaQuery } from "@/hooks/use-media-query";

const UserManagement = () => {
  const { user, isAdmin, impersonateUser } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
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
    <PageLayout title="Gestion des utilisateurs" titleAction={titleAction}>
      {!isAdmin ? (
        <AccessDenied />
      ) : (
        <AnimatedContainer delay={200}>
          <div className={isMobile ? "w-full" : "max-w-5xl mx-auto"}>
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
          </div>
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default UserManagement;
