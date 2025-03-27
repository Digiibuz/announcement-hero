
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

interface UserListProps {
  users: UserProfile[];
  isLoading: boolean;
  onResetPassword: (userId: string) => void;
  onImpersonateUser: (user: UserProfile) => void;
}

const UserList: React.FC<UserListProps> = ({ 
  users, 
  isLoading, 
  onResetPassword, 
  onImpersonateUser 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Espace client</TableHead>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "admin" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400"
                  }`}>
                    {user.role === "admin" ? "Administrateur" : "Éditeur"}
                  </span>
                </TableCell>
                <TableCell>{user.clientId || "-"}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onResetPassword(user.id)}
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;
