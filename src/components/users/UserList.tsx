import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Loader2, AlertTriangle, UserMinus } from "lucide-react";
import { UserProfile } from "@/types/auth";
import UserEditForm from "./UserEditForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserListProps {
  users: UserProfile[];
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onResetPassword: (email: string) => void;
  onImpersonateUser: (user: UserProfile) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  isLoading,
  isDeleting,
  isUpdating,
  onResetPassword, 
  onImpersonateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const getWordPressConfigName = (user: UserProfile) => {
    if (user.wordpressConfig) {
      return `${user.wordpressConfig.name} (${user.wordpressConfig.site_url})`;
    }
    return "-";
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'client': return 'Client';
      case 'editor': return 'Éditeur';
      default: return role;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      case 'editor': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400';
      default: return '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>WordPress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Chargement des utilisateurs...
                </div>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Aucun utilisateur trouvé
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </TableCell>
                <TableCell>{getWordPressConfigName(user)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <UserEditForm 
                      user={user} 
                      onUserUpdated={onUpdateUser}
                      onDeleteUser={onDeleteUser}
                      isUpdating={isUpdating}
                      isDeleting={isDeleting}
                    />
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onResetPassword(user.email)}
                    >
                      Réinitialiser MDP
                    </Button>
                    
                    {user.role === "editor" && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onImpersonateUser(user)}
                      >
                        Se connecter en tant que
                      </Button>
                    )}
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(user.id)}
                      disabled={isDeleting}
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Confirmation de suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserList;
