
import React, { useEffect } from "react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import UserCreateForm from "@/components/users/UserCreateForm";
import UserList from "@/components/users/UserList";
import AccessDenied from "@/components/users/AccessDenied";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner"; // Import toast from sonner

const UserManagement = () => {
  const { user, isAdmin } = useAuth();
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
  
  // Fetch users on component mount
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleUserCreated = () => {
    console.log("Rafraîchissement de la liste des utilisateurs après création");
    fetchUsers();
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success("Liste des utilisateurs mise à jour");
  };

  // Add impersonation handler (empty for now)
  const handleImpersonateUser = (user: UserProfile) => {
    // This functionality is not implemented but required by the UserList component
    console.log("Impersonation feature not implemented");
  };

  const titleAction = isAdmin ? (
    <UserCreateForm onUserCreated={handleUserCreated} />
  ) : null;

  return (
    <PageLayout 
      title="Gestion des utilisateurs" 
      titleAction={titleAction} 
      containerClassName="max-w-full"
      onRefresh={handleRefresh}
    >
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
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onImpersonateUser={handleImpersonateUser}
          />
        </AnimatedContainer>
      )}
    </PageLayout>
  );
};

export default UserManagement;
