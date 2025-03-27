
import React from "react";
import Header from "@/components/ui/layout/Header";
import Sidebar from "@/components/ui/layout/Sidebar";
import AnimatedContainer from "@/components/ui/AnimatedContainer";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import UserCreateForm from "@/components/users/UserCreateForm";
import UserList from "@/components/users/UserList";
import AccessDenied from "@/components/users/AccessDenied";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserProfile } from "@/types/auth";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="pt-16 md:pl-64">
        <div className="container px-4 py-8">
          {!isAdmin ? (
            <AccessDenied />
          ) : (
            <AnimatedContainer>
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
                  <UserCreateForm onUserCreated={fetchUsers} />
                </div>

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
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
