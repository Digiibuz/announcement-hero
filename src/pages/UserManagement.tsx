
import React, { useEffect } from "react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import UserCreateForm from "@/components/users/UserCreateForm";
import UserList from "@/components/users/UserList";
import AccessDenied from "@/components/users/AccessDenied";
import PageLayout from "@/components/ui/layout/PageLayout";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserProfile } from "@/types/auth";

const UserManagement = () => {
  const { user, isAdmin, impersonateUser, session } = useAuth();
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
  
  // Make sure user data is loaded when tab is reactivated
  useEffect(() => {
    console.log("UserManagement: Session check", { 
      sessionExists: !!session, 
      userExists: !!user 
    });
    
    if (session && user) {
      console.log("UserManagement: Session and user verified, fetching data");
      fetchUsers();
    }
  }, [session, user]);

  // Add visibility change event listener specifically for this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session && user) {
        console.log("UserManagement: Tab became visible again, refreshing data");
        fetchUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, user, fetchUsers]);

  const handleImpersonateUser = (userToImpersonate: UserProfile) => {
    impersonateUser(userToImpersonate);
    toast.success(`Vous êtes maintenant connecté en tant que ${userToImpersonate.name}`);
  };

  const titleAction = isAdmin ? (
    <UserCreateForm onUserCreated={fetchUsers} />
  ) : null;

  return (
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
  );
};

export default UserManagement;
