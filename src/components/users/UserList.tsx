
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
import { Loader2, AlertTriangle, UserMinus, Clock, User, Mail, BadgeCheck } from "lucide-react";
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
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Card, CardContent } from "@/components/ui/card";

interface UserListProps {
  users: UserProfile[];
  isLoading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onResetPassword: (email: string) => void;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onImpersonateUser: (user: UserProfile) => void; // Add this prop to match what UserManagement is passing
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
      default: return role;
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      default: return '';
    }
  };

  const formatLastLogin = (lastLogin: string | null | undefined) => {
    if (!lastLogin) return "Jamais";
    try {
      const date = parseISO(lastLogin);
      return format(date, "dd MMM yyyy, HH:mm", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Format invalide";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
        <div className="flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Chargement des utilisateurs...
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8 text-center">
        Aucun utilisateur trouvé
      </div>
    );
  }

  if (isMobile) {
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
                  <span className="text-muted-foreground">Dernière connexion:</span>
                  <span className="ml-1">{formatLastLogin(user.lastLogin)}</span>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
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
              </div>
            </CardContent>
          </Card>
        ))}
        
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
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>WordPress</TableHead>
              <TableHead>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Dernière connexion
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </TableCell>
                <TableCell>{getWordPressConfigName(user)}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatLastLogin(user.lastLogin)}
                </TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
      
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
