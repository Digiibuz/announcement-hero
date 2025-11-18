#!/bin/bash

# Script de configuration OAuth Facebook pour iOS - DigiiBuz
# Usage: ./configure-facebook-ios.sh <FACEBOOK_APP_ID> <FACEBOOK_CLIENT_TOKEN>

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "=========================================="
echo "  Configuration OAuth Facebook iOS"
echo "  DigiiBuz"
echo "=========================================="
echo ""

# Vérifier les arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}❌ Erreur: Arguments manquants${NC}"
    echo ""
    echo "Usage: ./configure-facebook-ios.sh <FACEBOOK_APP_ID> <FACEBOOK_CLIENT_TOKEN>"
    echo ""
    echo "Exemple:"
    echo "  ./configure-facebook-ios.sh 1234567890 abcdef123456"
    echo ""
    exit 1
fi

FACEBOOK_APP_ID=$1
FACEBOOK_CLIENT_TOKEN=$2
BUNDLE_ID="com.digiibuz.app"

echo -e "${GREEN}📱 Facebook App ID:${NC} $FACEBOOK_APP_ID"
echo -e "${GREEN}🔑 Client Token:${NC} ${FACEBOOK_CLIENT_TOKEN:0:10}..."
echo -e "${GREEN}📦 Bundle ID:${NC} $BUNDLE_ID"
echo ""

# Vérifier si le projet iOS existe
IOS_PROJECT_PATH="../ios/App/App"

if [ ! -d "../ios" ]; then
    echo -e "${YELLOW}⚠️  Le dossier iOS n'existe pas${NC}"
    echo ""
    echo -e "${BLUE}Voulez-vous initialiser le projet iOS maintenant ? (y/n)${NC}"
    read -r response

    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}🔧 Initialisation du projet iOS...${NC}"
        cd ..
        npx cap add ios
        npx cap sync ios
        cd android
        echo -e "${GREEN}✅ Projet iOS initialisé${NC}"
        echo ""
    else
        echo -e "${YELLOW}Pour initialiser plus tard, exécutez:${NC}"
        echo "  cd .."
        echo "  npx cap add ios"
        echo "  npx cap sync ios"
        echo ""
        exit 0
    fi
fi

# Chemin du fichier Info.plist
PLIST_FILE="../ios/App/App/Info.plist"

if [ ! -f "$PLIST_FILE" ]; then
    echo -e "${RED}❌ Erreur: Info.plist introuvable à $PLIST_FILE${NC}"
    echo ""
    echo "Assurez-vous que le projet iOS est bien initialisé."
    exit 1
fi

echo -e "${YELLOW}⚙️  Mise à jour de Info.plist...${NC}"

# Backup du fichier
cp "$PLIST_FILE" "$PLIST_FILE.backup"
echo -e "${GREEN}✅ Backup créé: ${PLIST_FILE}.backup${NC}"

# Créer le contenu XML à ajouter
cat > /tmp/facebook-config.xml << EOF

	<!-- Facebook Configuration -->
	<key>FacebookAppID</key>
	<string>$FACEBOOK_APP_ID</string>
	<key>FacebookClientToken</key>
	<string>$FACEBOOK_CLIENT_TOKEN</string>
	<key>FacebookDisplayName</key>
	<string>DigiiBuz</string>

	<!-- URL Schemes -->
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>fb$FACEBOOK_APP_ID</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>$BUNDLE_ID</string>
			</array>
		</dict>
	</array>

	<!-- Query Schemes for Facebook -->
	<key>LSApplicationQueriesSchemes</key>
	<array>
		<string>fbapi</string>
		<string>fb-messenger-share-api</string>
		<string>fbauth2</string>
		<string>fbshareextension</string>
	</array>
EOF

echo -e "${BLUE}📝 Configuration Facebook à ajouter dans Info.plist:${NC}"
echo ""
cat /tmp/facebook-config.xml
echo ""
echo -e "${YELLOW}⚠️  Ajout manuel requis${NC}"
echo ""
echo "Le fichier Info.plist doit être édité manuellement dans Xcode."
echo ""
echo -e "${GREEN}Instructions:${NC}"
echo "1. Ouvrez Xcode: ${BLUE}npx cap open ios${NC}"
echo "2. Dans le navigateur de fichiers, ouvrez: ${BLUE}App/App/Info.plist${NC}"
echo "3. Clic droit sur Info.plist > Open As > Source Code"
echo "4. Copiez le contenu ci-dessus avant la balise </dict> finale"
echo "5. Sauvegardez (⌘+S)"
echo ""

# Vérifier capacitor.config.json
CAPACITOR_CONFIG="../ios/App/capacitor.config.json"
if [ ! -f "$CAPACITOR_CONFIG" ]; then
    CAPACITOR_CONFIG="../capacitor.config.json"
fi

if [ -f "$CAPACITOR_CONFIG" ]; then
    if grep -q '"server"' "$CAPACITOR_CONFIG"; then
        echo -e "${RED}⚠️  ATTENTION: Mode 'hosted' détecté !${NC}"
        echo ""
        echo "Le fichier capacitor.config.json contient une section 'server'."
        echo "L'OAuth Facebook ne fonctionnera pas en mode hosted."
        echo ""
        echo -e "${YELLOW}Recommandation: Supprimez la section 'server' de capacitor.config.json${NC}"
        echo ""
    else
        echo -e "${GREEN}✅ capacitor.config.json correctement configuré (mode native)${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo ""
echo "1. ${GREEN}Éditer Info.plist dans Xcode${NC} (voir instructions ci-dessus)"
echo ""
echo "2. ${GREEN}Configurer Facebook Developer Console${NC}"
echo "   - Ajoutez la plateforme iOS"
echo "   - Bundle ID: ${BLUE}$BUNDLE_ID${NC}"
echo "   - URIs de redirection OAuth:"
echo "     • https://app.digiibuz.fr/callback"
echo "     • fb${FACEBOOK_APP_ID}://authorize/"
echo ""
echo "3. ${GREEN}Vérifier le Bundle Identifier dans Xcode${NC}"
echo "   - Target App > General"
echo "   - Bundle Identifier = ${BLUE}$BUNDLE_ID${NC}"
echo ""
echo "4. ${GREEN}Supprimer 'server.url' de capacitor.config.json${NC}"
echo ""
echo "5. ${GREEN}Synchroniser et tester${NC}"
echo "   ${BLUE}npx cap sync ios${NC}"
echo "   ${BLUE}npx cap open ios${NC}"
echo "   Puis cliquez sur ▶️ dans Xcode"
echo ""
echo "6. ${GREEN}Tester sur un VRAI device iOS${NC} (pas simulateur)"
echo ""

# Afficher le template Info.plist complet si demandé
echo -e "${BLUE}Voulez-vous voir un exemple complet de Info.plist ? (y/n)${NC}"
read -r show_example

if [[ "$show_example" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Exemple complet Info.plist (extrait)${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
    echo ""
    cat << 'EXAMPLE'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<!-- ... autres clés existantes ... -->

	<!-- Facebook Configuration -->
	<key>FacebookAppID</key>
	<string>1234567890</string>
	<key>FacebookClientToken</key>
	<string>votre_client_token</string>
	<key>FacebookDisplayName</key>
	<string>DigiiBuz</string>

	<!-- URL Schemes -->
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>fb1234567890</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>com.digiibuz.app</string>
			</array>
		</dict>
	</array>

	<!-- Query Schemes for Facebook -->
	<key>LSApplicationQueriesSchemes</key>
	<array>
		<string>fbapi</string>
		<string>fb-messenger-share-api</string>
		<string>fbauth2</string>
		<string>fbshareextension</string>
	</array>

	<!-- ... autres clés existantes ... -->
</dict>
</plist>
EXAMPLE
    echo ""
fi

echo ""
echo -e "${GREEN}✅ Configuration iOS préparée!${NC}"
echo ""
echo "Pour plus d'informations, consultez:"
echo "  • CONFIGURATION_OAUTH_FACEBOOK_iOS.md"
echo "  • COMPARAISON_ANDROID_iOS.md"
echo ""

