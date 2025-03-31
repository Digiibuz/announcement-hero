
import React, { useEffect, useCallback } from "react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import UserCreateForm from "@/components/users/UserCreateForm";
import UserList from "@/components/users/UserList";
import AccessDenied from "@/components/users/AccessDenied";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserProfile } from "@/types/auth";
import { toast } from "sonner";

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
  
  // Use useCallback to memoize the fetchUsers function to avoid unnecessary re-renders
  const refreshUsers = useCallback(() => {
    if (isAdmin) {
      console.log("Refreshing user list");
      fetchUsers().catch(err => {
        console.error("Error fetching users:", err);
        toast.error("Erreur lors du chargement des utilisateurs");
      });
    }
  }, [isAdmin, fetchUsers]);
  
  // Fetch users on component mount with error handling
  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleUserCreated = () => {
    console.log("Rafraîchissement de la liste des utilisateurs après création");
    refreshUsers();
  };

  const handleRefresh = () => {
    refreshUsers();
    toast.success("Liste des utilisateurs mise à jour");
  };

  // Add impersonation handler (empty for now since this requirement was removed)
  const handleImpersonateUser = (user: UserProfile) => {
    // This functionality is not implemented but required by the UserList component
    console.log("Impersonation feature not implemented");
  };

  const titleAction = isAdmin ? (
    <UserCreateForm onUserCreated={handleUserCreated} />
  ) : null;

  // Early return pattern for better error handling
  if (!isAdmin) {
    return (
      <PageLayout 
        title="Gestion des utilisateurs" 
        containerClassName="max-w-full"
      >
        <AccessDenied />
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Gestion des utilisateurs" 
      titleAction={titleAction} 
      containerClassName="max-w-full"
      onRefresh={handleRefresh}
    >
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
    </PageLayout>
  );
};

export default UserManagement;
