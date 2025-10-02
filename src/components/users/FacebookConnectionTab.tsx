import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFacebookConnection } from '@/hooks/useFacebookConnection';
import { Facebook, Trash2, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FacebookConnectionTab = () => {
  const {
    connections,
    isLoading,
    isConnecting,
    hasActiveConnection,
    connectFacebook,
    disconnectFacebook,
  } = useFacebookConnection();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            Connexion Facebook
          </CardTitle>
          <CardDescription>
            Connectez vos pages Facebook pour publier automatiquement vos annonces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasActiveConnection ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Vous n'avez pas encore connecté de page Facebook. Cliquez sur le bouton ci-dessous pour commencer.
                </AlertDescription>
              </Alert>
              <Button
                onClick={connectFacebook}
                disabled={isConnecting}
                className="w-full"
              >
                <Facebook className="mr-2 h-4 w-4" />
                {isConnecting ? 'Connexion en cours...' : 'Connecter Facebook'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-success">
                <CheckCircle className="h-4 w-4" />
                <span>Pages Facebook connectées</span>
              </div>
              
              <div className="space-y-3">
                {connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="flex items-center justify-between pt-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Facebook className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{connection.page_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Connectée le {new Date(connection.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => disconnectFacebook(connection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <Button
                onClick={connectFacebook}
                variant="outline"
                className="w-full"
              >
                <Facebook className="mr-2 h-4 w-4" />
                Ajouter une autre page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookConnectionTab;
