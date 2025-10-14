import PageLayout from "@/components/ui/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Politique de Confidentialité</h1>
        
        <Card className="mb-6">
          <CardContent className="prose prose-sm max-w-none pt-6">
            <p className="text-muted-foreground">
              <strong>Date de dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">1. Responsable du traitement des données</h2>
              <p>
                Le responsable du traitement des données à caractère personnel collectées via cette application est :
              </p>
              <ul className="list-none pl-0 mt-4">
                <li><strong>Société :</strong> Digiibuz</li>
                <li><strong>Responsable de la protection des données :</strong> Bouquet Melvin, dirigeant</li>
                <li><strong>Adresse :</strong> 2 rue des Roitelets, 66700 Argelès-sur-Mer, France</li>
                <li><strong>Email de contact :</strong> support@digiibuz.fr</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">2. Données personnelles collectées</h2>
              <p>
                Dans le cadre de l'utilisation de notre application de gestion et de publication de contenu sur WordPress et les réseaux sociaux, nous collectons et traitons les données suivantes :
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1. Données d'identification et de compte</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Mot de passe (crypté)</li>
                <li>Rôle utilisateur (administrateur, éditeur, client, commercial)</li>
                <li>Identifiant client (le cas échéant)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.2. Données de configuration WordPress</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>URL du site WordPress</li>
                <li>Identifiants de connexion WordPress (nom d'utilisateur, mot de passe d'application)</li>
                <li>Clés API REST WordPress</li>
                <li>Catégories et mots-clés configurés</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.3. Données de connexion aux réseaux sociaux</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tokens d'accès Facebook et Instagram</li>
                <li>Identifiants de pages Facebook et comptes Instagram</li>
                <li>Tokens d'accès Google Business Profile</li>
                <li>Informations de compte Google (email, identifiants de localisation)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.4. Données de contenu</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Annonces créées (titres, descriptions, images)</li>
                <li>Métadonnées SEO (titres, descriptions, slugs)</li>
                <li>Contenus générés par IA</li>
                <li>Images et médias téléchargés</li>
                <li>Hashtags et mots-clés</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">2.5. Données d'utilisation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dates et heures de connexion</li>
                <li>Nombre de publications effectuées</li>
                <li>Nombre de générations IA utilisées</li>
                <li>Historique des publications sur WordPress et réseaux sociaux</li>
                <li>Statuts de publication (réussi, échoué, en attente)</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">3. Finalités du traitement</h2>
              <p>Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Gestion des comptes utilisateurs :</strong> création, authentification et gestion de votre compte</li>
                <li><strong>Publication de contenu :</strong> publication automatique sur WordPress, Facebook, Instagram et Google Business</li>
                <li><strong>Génération de contenu par IA :</strong> optimisation et création de contenu marketing</li>
                <li><strong>Gestion des sites WordPress :</strong> connexion et synchronisation avec vos sites WordPress</li>
                <li><strong>Gestion des limites d'utilisation :</strong> suivi des quotas mensuels de publications et générations IA</li>
                <li><strong>Support client :</strong> assistance technique et résolution de problèmes</li>
                <li><strong>Amélioration du service :</strong> analyse de l'utilisation pour optimiser l'application</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">4. Base légale du traitement</h2>
              <p>Conformément au RGPD, les traitements de données sont fondés sur :</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>L'exécution du contrat :</strong> la fourniture du service nécessite le traitement de vos données</li>
                <li><strong>Votre consentement :</strong> pour les connexions aux réseaux sociaux et l'utilisation de l'IA</li>
                <li><strong>L'intérêt légitime :</strong> pour l'amélioration du service et la sécurité</li>
                <li><strong>Les obligations légales :</strong> conservation des données comptables et fiscales</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">5. Destinataires des données</h2>
              <p>Vos données personnelles peuvent être partagées avec les destinataires suivants :</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">5.1. Sous-traitants techniques</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase :</strong> hébergement de la base de données et authentification (stockage sécurisé)</li>
                <li><strong>OpenAI :</strong> génération de contenu par intelligence artificielle</li>
                <li><strong>Meta (Facebook/Instagram) :</strong> publication de contenu sur les plateformes sociales</li>
                <li><strong>Google :</strong> publication sur Google Business Profile et authentification</li>
                <li><strong>Resend :</strong> envoi d'emails transactionnels (notifications, identifiants)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">5.2. Autres destinataires</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personnel autorisé de Digiibuz pour le support technique</li>
                <li>Autorités compétentes en cas d'obligation légale</li>
              </ul>

              <p className="mt-4">
                Tous nos sous-traitants sont contractuellement tenus de respecter le RGPD et d'assurer un niveau de protection adéquat de vos données.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">6. Transferts de données hors de l'Union Européenne</h2>
              <p>
                Certaines de vos données personnelles sont transférées vers des pays situés en dehors de l'Union Européenne :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Supabase :</strong> les données peuvent être hébergées aux États-Unis avec des garanties de protection appropriées (clauses contractuelles types)</li>
                <li><strong>OpenAI :</strong> traitement de données aux États-Unis dans le cadre de la génération de contenu IA, avec des mesures de sécurité contractuelles</li>
              </ul>
              <p className="mt-4">
                Ces transferts sont effectués conformément au chapitre V du RGPD, avec des garanties appropriées telles que les clauses contractuelles types approuvées par la Commission européenne.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">7. Durée de conservation des données</h2>
              <p>Vos données personnelles sont conservées selon les principes suivants :</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Données de compte et d'utilisation :</strong> pendant toute la durée de votre souscription au service, telle que définie dans votre contrat</li>
                <li><strong>Après résiliation du contrat :</strong> votre compte sera suspendu puis supprimé immédiatement après la résiliation de la prestation</li>
                <li><strong>Données de facturation :</strong> conservées 10 ans conformément aux obligations comptables et fiscales</li>
                <li><strong>Logs de connexion :</strong> 12 mois maximum pour des raisons de sécurité</li>
              </ul>
              <p className="mt-4">
                À l'issue de ces périodes, vos données sont supprimées de manière sécurisée et définitive.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">8. Vos droits</h2>
              <p>
                Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données dans certains cas</li>
                <li><strong>Droit à la limitation du traitement :</strong> limiter l'utilisation de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
                <li><strong>Droit de retirer votre consentement :</strong> pour les traitements basés sur le consentement</li>
              </ul>
              <p className="mt-4">
                Pour exercer ces droits, contactez-nous à l'adresse : <strong>support@digiibuz.fr</strong>
              </p>
              <p className="mt-2">
                Nous répondrons à votre demande dans un délai d'un mois. En cas de complexité ou de nombre important de demandes, ce délai peut être prolongé de deux mois supplémentaires.
              </p>
              <p className="mt-2">
                Vous disposez également du droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">9. Sécurité des données</h2>
              <p>
                Digiibuz met en œuvre toutes les mesures techniques et organisationnelles appropriées pour garantir la sécurité de vos données personnelles :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Chiffrement des mots de passe et des données sensibles</li>
                <li>Protocole HTTPS pour toutes les communications</li>
                <li>Authentification sécurisée avec gestion des sessions</li>
                <li>Contrôle d'accès basé sur les rôles (RLS - Row Level Security)</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Surveillance et journalisation des accès</li>
                <li>Formation du personnel sur la protection des données</li>
              </ul>
              <p className="mt-4">
                En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, nous vous en informerons conformément aux exigences du RGPD.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">10. Cookies et technologies similaires</h2>
              <p>
                Notre application utilise des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement de l'application (authentification, session)</li>
                <li><strong>Stockage local :</strong> pour sauvegarder vos préférences et brouillons</li>
              </ul>
              <p className="mt-4">
                Les cookies essentiels ne nécessitent pas de consentement préalable car ils sont strictement nécessaires à la fourniture du service que vous avez demandé.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">11. Données des réseaux sociaux</h2>
              <p>
                Lorsque vous connectez vos comptes de réseaux sociaux (Facebook, Instagram, Google Business), nous :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Utilisons uniquement les permissions strictement nécessaires à la publication de contenu</li>
                <li>Ne collectons pas vos données personnelles depuis ces plateformes au-delà de ce qui est nécessaire</li>
                <li>Stockons de manière sécurisée les tokens d'accès qui permettent la publication</li>
                <li>Vous permettons de révoquer à tout moment l'accès à ces comptes</li>
              </ul>
              <p className="mt-4">
                Les publications effectuées via notre application sont soumises aux politiques de confidentialité respectives de chaque plateforme sociale.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">12. Utilisation de l'intelligence artificielle</h2>
              <p>
                Notre application utilise des services d'intelligence artificielle (OpenAI) pour générer et optimiser du contenu. Dans ce cadre :
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Seules les informations nécessaires à la génération de contenu sont transmises au service IA</li>
                <li>Les données transmises sont traitées conformément aux politiques de confidentialité d'OpenAI</li>
                <li>Vous disposez de limites mensuelles de génération IA configurables</li>
                <li>Le contenu généré vous appartient et peut être modifié à tout moment</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">13. Modifications de la politique de confidentialité</h2>
              <p>
                Digiibuz se réserve le droit de modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou via une notification dans l'application.
              </p>
              <p className="mt-4">
                La version la plus récente de cette politique est toujours disponible sur cette page, avec indication de la date de dernière mise à jour en haut du document.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
              <p>
                Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles, vous pouvez nous contacter :
              </p>
              <ul className="list-none pl-0 mt-4">
                <li><strong>Par email :</strong> support@digiibuz.fr</li>
                <li><strong>Par courrier :</strong> Digiibuz, 2 rue des Roitelets, 66700 Argelès-sur-Mer, France</li>
                <li><strong>Responsable de la protection des données :</strong> Bouquet Melvin</li>
              </ul>
            </section>

            <section className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Cette politique de confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi Informatique et Libertés modifiée.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default PrivacyPolicy;
