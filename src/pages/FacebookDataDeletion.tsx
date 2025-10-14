import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const FacebookDataDeletion = () => {
  const [searchParams] = useSearchParams();
  const confirmationId = searchParams.get('id');
  const [status, setStatus] = useState<'loading' | 'completed' | 'error'>('loading');

  useEffect(() => {
    if (confirmationId) {
      // Simulate status check - in production this would call the status endpoint
      setStatus('completed');
    }
  }, [confirmationId]);

  if (confirmationId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-success" />
              Suppression confirmée
            </CardTitle>
            <CardDescription>
              Code de confirmation : {confirmationId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Vos données Facebook ont été supprimées avec succès de l'application Digiibuz.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Suppression des données Facebook</CardTitle>
          <CardDescription>
            Politique de suppression des données pour l'application Digiibuz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cette page décrit comment vos données Facebook sont gérées par l'application Digiibuz.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">Données collectées</h3>
              <p className="text-sm text-muted-foreground">
                Lorsque vous connectez votre page Facebook à Digiibuz, nous collectons et stockons :
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Le nom de votre page Facebook</li>
                <li>L'identifiant de votre page Facebook</li>
                <li>Un token d'accès pour publier sur votre page</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Suppression de vos données</h3>
              <p className="text-sm text-muted-foreground">
                Vous pouvez supprimer vos données de deux manières :
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>
                  <strong>Via l'application :</strong> Accédez à votre profil utilisateur et déconnectez votre page Facebook. 
                  Cela supprimera immédiatement toutes les données associées.
                </li>
                <li>
                  <strong>Via Facebook :</strong> Révoquez l'accès de l'application dans vos paramètres Facebook. 
                  Nos serveurs recevront automatiquement une demande de suppression et supprimeront toutes vos données.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Délai de suppression</h3>
              <p className="text-sm text-muted-foreground">
                Toutes vos données sont supprimées immédiatement et de manière définitive dès réception de votre demande.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Pour toute question concernant vos données, contactez-nous à :{' '}
                <a href="mailto:contact@digiibuz.fr" className="text-primary hover:underline">
                  contact@digiibuz.fr
                </a>
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookDataDeletion;
