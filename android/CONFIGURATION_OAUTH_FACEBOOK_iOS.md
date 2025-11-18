# 🍎 Configuration OAuth Facebook pour iOS/App Store - DigiiBuz

## ✅ Bonne nouvelle !

La configuration que nous avons faite pour Android **fonctionnera aussi pour iOS**, mais avec quelques ajustements spécifiques à Apple.

## 📋 Différences clés Android vs iOS

| Aspect | Android | iOS |
|--------|---------|-----|
| **Hash de clé** | Requis (keytool) | Non requis |
| **Bundle ID** | Package Name | Bundle Identifier |
| **URL Scheme** | Intent Filters | URL Types dans Info.plist |
| **Configuration** | AndroidManifest.xml | Info.plist |
| **Fichier de config** | strings.xml | Info.plist |

## 🚀 Configuration iOS - Guide pas à pas

### Prérequis

1. Xcode installé (version 14+ recommandée)
2. Compte Apple Developer (gratuit pour dev, payant pour App Store)
3. Votre projet Capacitor avec iOS initialisé

### Étape 1 : Initialiser le projet iOS (si pas déjà fait)

```bash
# À la racine de votre projet (parent du dossier android)
npx cap add ios
npx cap sync ios
```

### Étape 2 : Configurer Facebook Developer Console pour iOS

1. Allez sur https://developers.facebook.com/apps/
2. Sélectionnez votre application
3. **Paramètres > Général** → Cliquez sur "Ajouter une plateforme" → **iOS**
4. Remplir :
   - **Bundle ID** : `com.digiibuz.app` (même que Android pour cohérence)
   - **App Store ID** : (laissez vide pour le dev, remplissez après publication)
   - **Nom de l'équipe** : Votre Team ID Apple Developer

### Étape 3 : Récupérer votre Facebook App ID et Client Token

Dans Facebook Developer Console :
- **Paramètres > Général**
- Notez :
  - **ID de l'app** (ex: 1234567890)
  - **Jeton client** (Client Token)

### Étape 4 : Configurer Info.plist

Ouvrir le projet dans Xcode :
```bash
npx cap open ios
```

Puis éditer `App/App/Info.plist` et ajouter :

```xml
<key>CFBundleURLTypes</key>
<array>
  <!-- Facebook URL Scheme -->
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>fb[VOTRE_FACEBOOK_APP_ID]</string>
    </array>
  </dict>
  <!-- Custom URL Scheme pour votre app -->
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.digiibuz.app</string>
    </array>
  </dict>
</array>

<!-- Facebook Configuration -->
<key>FacebookAppID</key>
<string>[VOTRE_FACEBOOK_APP_ID]</string>

<key>FacebookClientToken</key>
<string>[VOTRE_FACEBOOK_CLIENT_TOKEN]</string>

<key>FacebookDisplayName</key>
<string>DigiiBuz</string>

<!-- Autoriser l'ouverture de Facebook -->
<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
```

**Exemple avec des vraies valeurs** (si votre App ID est `1234567890`) :

```xml
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

<key>FacebookAppID</key>
<string>1234567890</string>

<key>FacebookClientToken</key>
<string>votre_client_token</string>

<key>FacebookDisplayName</key>
<string>DigiiBuz</string>

<key>LSApplicationQueriesSchemes</key>
<array>
  <string>fbapi</string>
  <string>fb-messenger-share-api</string>
  <string>fbauth2</string>
  <string>fbshareextension</string>
</array>
```

### Étape 5 : Vérifier le Bundle Identifier

Dans Xcode :
1. Sélectionnez le projet `App` dans le navigateur
2. Target `App` > General
3. Vérifiez que **Bundle Identifier** = `com.digiibuz.app`

### Étape 6 : Configurer les URIs de redirection OAuth

Dans Facebook Developer Console > **Connexion Facebook > Paramètres** :

Ajoutez les URIs de redirection OAuth valides :
- `https://app.digiibuz.fr/callback`
- `fb[VOTRE_APP_ID]://authorize/`
- `com.digiibuz.app://callback` (custom scheme)

### Étape 7 : Mode Hosted vs Native (IMPORTANT)

Comme pour Android, le mode "hosted" de Capacitor est **incompatible** avec OAuth natif.

#### Option A : Mode Développement (hosted)
Garder `capacitor.config.json` avec `server.url` → OAuth ne fonctionnera pas

#### Option B : Mode Production (native) - RECOMMANDÉ
Supprimer la section `server` du `capacitor.config.json` :

```json
{
  "appId": "com.digiibuz.app",
  "appName": "DigiiBuz",
  "webDir": "dist",
  "plugins": {
    ...
  }
}
```

### Étape 8 : Construire et tester

```bash
# Synchroniser les changements
npx cap sync ios

# Ouvrir dans Xcode
npx cap open ios

# Dans Xcode :
# 1. Sélectionnez un device ou simulateur
# 2. Cliquez sur le bouton Play (▶️)
# 3. Testez le login Facebook
```

⚠️ **Note importante** : L'OAuth Facebook sur simulateur iOS peut être capricieux. Testez de préférence sur un **vrai device iOS**.

## 🔍 Vérification de la configuration

### Checklist iOS
- [ ] Projet iOS initialisé (`npx cap add ios`)
- [ ] Facebook App ID configuré dans Info.plist
- [ ] Facebook Client Token configuré dans Info.plist
- [ ] URL Schemes configurés (fb[APP_ID] et custom scheme)
- [ ] LSApplicationQueriesSchemes ajouté
- [ ] Bundle ID configuré dans Xcode et Facebook Console
- [ ] URIs de redirection configurées dans Facebook Developer Console
- [ ] Section `server.url` retirée de capacitor.config.json
- [ ] Testée sur un vrai device iOS

### Test de l'OAuth iOS

1. Ouvrir l'app sur votre iPhone/iPad
2. Cliquer sur "Se connecter avec Facebook"
3. Autoriser l'application
4. ✅ L'app doit s'ouvrir automatiquement avec l'utilisateur connecté
5. ❌ Si ça ouvre Safari, vérifier la configuration URL Schemes

## 🔐 Configuration Apple Developer pour App Store

### 1. Certificats et Provisioning Profiles

Pour publier sur l'App Store :

1. **Apple Developer Portal** (https://developer.apple.com)
2. **Certificates, Identifiers & Profiles**
3. Créer :
   - **App ID** : `com.digiibuz.app`
   - **Certificat de distribution**
   - **Provisioning Profile de distribution**

### 2. Associated Domains (optionnel mais recommandé)

Pour les Universal Links (deep links iOS) :

Dans Xcode :
1. Target `App` > Signing & Capabilities
2. Cliquez sur "+ Capability"
3. Ajoutez **Associated Domains**
4. Ajoutez : `applinks:app.digiibuz.fr`

Sur votre serveur web (app.digiibuz.fr), créez un fichier :
`.well-known/apple-app-site-association` :

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "[TEAM_ID].com.digiibuz.app",
        "paths": ["/callback", "/auth/*"]
      }
    ]
  }
}
```

### 3. Build pour l'App Store

```bash
# Dans Xcode
# 1. Sélectionnez "Any iOS Device (arm64)"
# 2. Product > Archive
# 3. Une fois l'archive créée, cliquez sur "Distribute App"
# 4. Suivez les étapes pour uploader sur App Store Connect
```

## 🐛 Débogage iOS

### Voir les logs iOS

Dans Xcode :
- Pendant l'exécution, voir la console en bas
- Ou : Window > Devices and Simulators > View Device Logs

Depuis le terminal :
```bash
# Pour un device connecté
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "DigiiBuz"'
```

### Problèmes courants iOS

**1. "Can't open URL"**
→ Vérifiez que les URL Schemes sont correctement configurés dans Info.plist

**2. "LSApplicationQueriesSchemes error"**
→ Ajoutez les schémas Facebook dans LSApplicationQueriesSchemes

**3. "Invalid Bundle Identifier"**
→ Vérifiez que le Bundle ID est le même dans Xcode et Facebook Console

**4. "Opening in Safari instead of app"**
→ Vérifiez que `server.url` est bien retiré du capacitor.config.json

**5. "App not installed" lors du callback**
→ Vérifiez que le URL Scheme fb[APP_ID] est correct

## 📱 Différences avec Android

### Ce qui est plus simple sur iOS :
- ✅ Pas de hash de clé à générer
- ✅ Configuration plus centralisée (Info.plist)
- ✅ Meilleure gestion des URL Schemes par le système

### Ce qui est plus complexe sur iOS :
- ⚠️ Nécessite un Mac avec Xcode
- ⚠️ Certificats et provisioning profiles pour App Store
- ⚠️ Team ID Apple Developer requis
- ⚠️ Review process plus strict d'Apple

## 🎯 Résumé : Android vs iOS

| Configuration | Android | iOS |
|--------------|---------|-----|
| **Manifeste** | AndroidManifest.xml | Info.plist |
| **Config Facebook** | strings.xml | Info.plist |
| **URL Scheme** | Intent Filters | CFBundleURLTypes |
| **Hash/Key** | Requis | Non requis |
| **IDE** | Android Studio | Xcode (Mac) |
| **Test device** | Fonctionne bien | Parfois capricieux sur simulateur |

## 📋 Code TypeScript (identique pour iOS et Android)

Le code que j'ai fourni dans `EXEMPLE_CODE_TYPESCRIPT.md` fonctionne **exactement pareil** sur iOS et Android ! Le plugin `@capgo/capacitor-social-login` gère automatiquement les différences de plateforme.

```typescript
import { SocialLogin } from '@capgo/capacitor-social-login';

// Ce code fonctionne sur iOS ET Android
async loginWithFacebook() {
  const result = await SocialLogin.login({
    provider: 'facebook',
    options: {
      permissions: ['public_profile', 'email']
    }
  });
  return result;
}
```

## 🔄 Workflow recommandé

### Phase de développement
1. Utiliser le mode "hosted" pour le développement rapide
2. Tester OAuth sur des builds natifs ponctuels

### Phase de production
1. Retirer `server.url` du capacitor.config.json
2. Builder une vraie app native
3. Uploader sur Google Play Store (Android) et App Store (iOS)

### Alternative : Flavors/Schemes
Créer deux configurations :
- **Dev** : avec server.url, sans OAuth
- **Prod** : sans server.url, avec OAuth natif

## 📚 Ressources iOS

- [Documentation Facebook SDK iOS](https://developers.facebook.com/docs/ios/)
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)

## ✅ Prochaines étapes pour iOS

1. Initialiser le projet iOS : `npx cap add ios`
2. Configurer Facebook Developer Console pour iOS
3. Éditer Info.plist avec les valeurs Facebook
4. Retirer `server.url` de capacitor.config.json
5. Tester sur un vrai device iOS
6. Créer les certificats Apple pour l'App Store

---

**💡 Conseil** : Gardez la même structure de configuration entre Android et iOS pour faciliter la maintenance. Le plugin `@capgo/capacitor-social-login` fait le gros du travail multiplateforme pour vous !

