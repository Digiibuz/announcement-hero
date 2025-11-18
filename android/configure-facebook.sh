#!/bin/bash

# Script de configuration OAuth Facebook pour DigiiBuz Android
# Usage: ./configure-facebook.sh <FACEBOOK_APP_ID> <FACEBOOK_CLIENT_TOKEN>

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  Configuration OAuth Facebook - DigiiBuz"
echo "=========================================="
echo ""

# Vérifier les arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}❌ Erreur: Arguments manquants${NC}"
    echo ""
    echo "Usage: ./configure-facebook.sh <FACEBOOK_APP_ID> <FACEBOOK_CLIENT_TOKEN>"
    echo ""
    echo "Exemple:"
    echo "  ./configure-facebook.sh 1234567890 abcdef123456"
    echo ""
    exit 1
fi

FACEBOOK_APP_ID=$1
FACEBOOK_CLIENT_TOKEN=$2

echo -e "${GREEN}📱 Facebook App ID:${NC} $FACEBOOK_APP_ID"
echo -e "${GREEN}🔑 Client Token:${NC} ${FACEBOOK_CLIENT_TOKEN:0:10}..."
echo ""

# Chemin du fichier strings.xml
STRINGS_FILE="app/src/main/res/values/strings.xml"

if [ ! -f "$STRINGS_FILE" ]; then
    echo -e "${RED}❌ Erreur: Fichier strings.xml introuvable à $STRINGS_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚙️  Mise à jour de strings.xml...${NC}"

# Backup du fichier original
cp "$STRINGS_FILE" "$STRINGS_FILE.backup"
echo -e "${GREEN}✅ Backup créé: ${STRINGS_FILE}.backup${NC}"

# Remplacer les valeurs
sed -i.tmp "s/YOUR_FACEBOOK_APP_ID/$FACEBOOK_APP_ID/g" "$STRINGS_FILE"
sed -i.tmp "s/YOUR_FACEBOOK_CLIENT_TOKEN/$FACEBOOK_CLIENT_TOKEN/g" "$STRINGS_FILE"
rm "${STRINGS_FILE}.tmp"

echo -e "${GREEN}✅ strings.xml mis à jour${NC}"
echo ""

# Afficher le résultat
echo -e "${YELLOW}📄 Contenu de strings.xml:${NC}"
cat "$STRINGS_FILE"
echo ""

# Générer le hash de clé (debug keystore)
echo -e "${YELLOW}🔐 Génération du hash de clé Android (debug)...${NC}"
echo ""

DEBUG_KEYSTORE="$HOME/.android/debug.keystore"

if [ -f "$DEBUG_KEYSTORE" ]; then
    echo -e "${GREEN}Debug keystore trouvé${NC}"
    KEY_HASH=$(keytool -exportcert -alias androiddebugkey -keystore "$DEBUG_KEYSTORE" -storepass android 2>/dev/null | openssl sha1 -binary | openssl base64)

    if [ ! -z "$KEY_HASH" ]; then
        echo -e "${GREEN}✅ Hash de clé généré:${NC} $KEY_HASH"
        echo ""
        echo -e "${YELLOW}📋 Copiez ce hash et ajoutez-le dans:${NC}"
        echo "   Facebook Developer Console > Votre App > Paramètres > Android"
        echo ""
    else
        echo -e "${RED}❌ Erreur lors de la génération du hash${NC}"
    fi
else
    echo -e "${RED}⚠️  Debug keystore introuvable à $DEBUG_KEYSTORE${NC}"
    echo "   Exécutez une fois Android Studio ou créez un build pour le générer"
fi

echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "1. Ajoutez le hash de clé dans Facebook Developer Console"
echo "2. Configurez les URIs de redirection OAuth:"
echo "   - https://app.digiibuz.fr/callback"
echo "   - fb${FACEBOOK_APP_ID}://authorize/"
echo "3. Retirez la section 'server.url' de capacitor.config.json"
echo "4. Reconstruisez l'app: ./gradlew clean assembleDebug"
echo "5. Testez sur un device réel"
echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "Pour plus d'informations, consultez: CONFIGURATION_OAUTH_FACEBOOK.md"

