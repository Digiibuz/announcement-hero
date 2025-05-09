
import React, { useState, useEffect } from 'react';
import { useSecureOperations } from '@/hooks/useSecureOperations';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export const SecureAdminPanel = () => {
  const { isAdmin } = useAuth();
  const { isLoading, getAllUsersWithRoles } = useSecureOperations();
  const [usersData, setUsersData] = useState<any>(null);

  const loadUsers = async () => {
    const data = await getAllUsersWithRoles();
    if (data) {
      setUsersData(data);
      toast.success("Données utilisateurs récupérées avec succès");
    }
  };

  // Vérification d'accès admin
  if (!isAdmin) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-4">
        <CardHeader>
          <CardTitle className="text-red-500">Accès refusé</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Vous n'avez pas les droits d'administration nécessaires pour accéder à cette page.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Panel d'Administration Sécurisé</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={loadUsers} 
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Chargement...' : 'Charger les utilisateurs'}
        </Button>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {usersData && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Liste des utilisateurs:</h3>
            <div className="border rounded">
              {usersData.profiles.map((profile: any) => (
                <div key={profile.id} className="p-3 border-b last:border-0 flex justify-between">
                  <div>
                    <p className="font-medium">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      profile.role === 'admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : profile.role === 'client' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {profile.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Informations de sécurité</h4>
          <p className="text-xs text-yellow-700">
            Cette page utilise une Edge Function sécurisée pour effectuer des opérations administratives sensibles.
            La clé de service reste sur le serveur et n'est jamais exposée côté client.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
