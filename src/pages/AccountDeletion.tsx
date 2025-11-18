import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Mail, AlertCircle, CheckCircle2 } from "lucide-react";

const AccountDeletion = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Suppression de compte DigiiBuz
          </h1>
          <p className="text-xl text-muted-foreground">
            Demande de suppression de compte et des données associées
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-destructive" />
              Procédure de suppression de compte
            </CardTitle>
            <CardDescription>
              Cette page vous explique comment demander la suppression de votre compte DigiiBuz
              et de toutes les données associées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps */}
            <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Étapes à suivre
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-4">
              <li>Ouvrez l'application DigiiBuz sur votre appareil</li>
              <li>Connectez-vous à votre compte</li>
              <li>Accédez à votre profil en cliquant sur votre nom en haut à droite</li>
              <li>Faites défiler jusqu'à la section "Zone dangereuse"</li>
              <li>Cliquez sur le bouton "Supprimer mon compte"</li>
              <li>Saisissez votre adresse email pour confirmer</li>
              <li>Cliquez sur "Supprimer définitivement"</li>
              <li>
                Votre compte sera immédiatement supprimé et vous recevrez un email de confirmation
              </li>
            </ol>
            </div>

            {/* Alternative Method */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Méthode alternative
              </h3>
              <p className="text-muted-foreground">
                Si vous ne parvenez pas à accéder à votre compte, vous pouvez envoyer une
                demande de suppression par email à :
              </p>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => window.location.href = "mailto:support@digiibuz.fr?subject=Demande de suppression de compte"}
              >
                <Mail className="h-4 w-4 mr-2" />
                support@digiibuz.fr
              </Button>
              <p className="text-sm text-muted-foreground">
                Veuillez inclure l'adresse email associée à votre compte dans votre demande.
              </p>
            </div>

            {/* Data Information */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Données supprimées
              </h3>
              <p className="text-muted-foreground">
                Lors de la suppression de votre compte, les données suivantes seront
                définitivement supprimées :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Informations de profil (nom, email)</li>
                <li>Toutes vos annonces créées</li>
                <li>Images et médias téléchargés</li>
                <li>Historique de publications</li>
                <li>Connexions aux réseaux sociaux (Facebook, Instagram)</li>
                <li>Configurations WordPress</li>
                <li>Compteurs de publications et génération IA</li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Données conservées
              </h3>
              <p className="text-muted-foreground">
                Conformément aux obligations légales, certaines données peuvent être conservées :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  Données de facturation : <strong>10 ans</strong> (obligation légale fiscale)
                </li>
                <li>
                  Logs de sécurité : <strong>12 mois</strong> (conformité RGPD)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Aucune autre donnée personnelle ne sera conservée au-delà de la suppression du
                compte.
              </p>
            </div>

            {/* Processing Time */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Délai de traitement
              </h3>
              <p className="text-muted-foreground">
                La suppression de votre compte est <strong>immédiate</strong> et irréversible.
                Vous recevrez un email de confirmation dans les 24 heures suivant la suppression.
              </p>
            </div>

            {/* Warning */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-destructive font-medium flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Attention :</strong> La suppression de votre compte est définitive et
                  irréversible. Toutes vos données seront perdues et ne pourront pas être
                  récupérées.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Pour toute question concernant la suppression de compte ou la gestion de vos données,
            contactez-nous à{" "}
            <a
              href="mailto:support@digiibuz.fr"
              className="text-primary hover:underline"
            >
              support@digiibuz.fr
            </a>
          </p>
          <p className="mt-2">
            DigiiBuz - Application de gestion d'annonces | Dernière mise à jour : Novembre 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
