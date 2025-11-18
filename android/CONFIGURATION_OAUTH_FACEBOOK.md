# 🔧 Configuration OAuth Facebook - DigiiBuz Android

## 📋 Problème résolu

Votre application redirige vers la version web après l'authentification Facebook au lieu de revenir à l'app native.

## ✅ Modifications effectuées

### 1. AndroidManifest.xml
- ✅ Ajout des meta-data Facebook SDK
- ✅ Ajout des activités Facebook (FacebookActivity, CustomTabActivity)
- ✅ Configuration des intent-filters pour les deep links OAuth

### 2. strings.xml
- ✅ Ajout des placeholders pour Facebook App ID et Client Token

## 🚀 Configuration requise

### Étape 1 : Configurer Facebook Developer Console

1. Allez sur https://developers.facebook.com/apps/
2. Sélectionnez votre application
3. Dans **Paramètres > Général** :
   - Notez votre **ID d'app** (ex: 1234567890)
   - Notez votre **Jeton client** (Client Token)

### Étape 2 : Générer le hash de clé Android

Pour le développement (debug keystore) :
```bash
keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore | openssl sha1 -binary | openssl base64
```
Mot de passe : `android`

Pour la production (votre keystore de release) :
```bash
keytool -exportcert -alias YOUR_ALIAS -keystore path/to/your/keystore.jks | openssl sha1 -binary | openssl base64
```

### Étape 3 : Configurer Facebook pour Android

Dans Facebook Developer Console > Paramètres > Paramètres Android :

1. **Ajouter une plateforme** > Android
2. Remplir :
   - **Nom du package** : `com.digiibuz.app`
   - **Nom de la classe par défaut de l'activité** : `com.digiibuz.app.MainActivity`
   - **Hash de clé** : (celui généré à l'étape 2)

3. Dans **Connexion Facebook > Paramètres** :
   - **URI de redirection OAuth valides** :
     - `https://app.digiibuz.fr/callback`
     - `fb{VOTRE_APP_ID}://authorize/` (remplacez par votre App ID réel)

### Étape 4 : Configurer strings.xml

Ouvrir `/android/app/src/main/res/values/strings.xml` et remplacer :

```xml
<string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
<string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
<string name="facebook_client_token">YOUR_FACEBOOK_CLIENT_TOKEN</string>
```

Par exemple, si votre Facebook App ID est `1234567890` :
```xml
<string name="facebook_app_id">1234567890</string>
<string name="fb_login_protocol_scheme">fb1234567890</string>
<string name="facebook_client_token">votre_client_token_ici</string>
```

### Étape 5 : Choisir le mode de déploiement

#### Option A : Mode Développement (avec hosted app)
Garder le fichier `capacitor.config.json` tel quel avec la section `server.url`.
⚠️ **L'OAuth Facebook ne fonctionnera pas correctement dans ce mode.**

#### Option B : Mode Production (app native) - RECOMMANDÉ
1. Éditer `/android/app/src/main/assets/capacitor.config.json`
2. Supprimer ou commenter la section `server` :

```json
{
  "appId": "com.digiibuz.app",
  "appName": "DigiiBuz",
  "webDir": "dist",
  // Supprimez cette section pour la production :
  // "server": {
  //   "url": "https://app.digiibuz.fr?forceHideBadge=true",
  //   "cleartext": true
  // },
  "plugins": {
    ...
  }
}
```

Un fichier de production est disponible : `capacitor.config.production.json`

### Étape 6 : Construire et tester

```bash
# Nettoyer le projet
cd /Users/melvinbouquet/StudioProjects/announcement-hero/android
./gradlew clean

# Construire l'APK
./gradlew assembleDebug

# Installer sur votre device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 🔍 Vérification de la configuration

### Checklist
- [ ] Facebook App ID configuré dans `strings.xml`
- [ ] Facebook Client Token configuré dans `strings.xml`
- [ ] Hash de clé Android ajouté dans Facebook Developer Console
- [ ] URLs de redirection configurées dans Facebook Developer Console
- [ ] Section `server.url` retirée de `capacitor.config.json` (pour production)
- [ ] App reconstruite avec `./gradlew clean assembleDebug`
- [ ] Testée sur un vrai device Android

### Test de l'OAuth

1. Ouvrir l'app sur votre device
2. Cliquer sur "Se connecter avec Facebook"
3. Autoriser l'application
4. ✅ L'app doit s'ouvrir automatiquement avec l'utilisateur connecté
5. ❌ Si ça redirige vers Chrome/le navigateur, c'est que la config n'est pas complète

## 🐛 Débogage

### Voir les logs Android
```bash
adb logcat | grep -i facebook
```

### Problèmes courants

**1. "Can't Load URL"**
→ Vérifiez que le hash de clé est correct dans Facebook Developer Console

**2. "Invalid OAuth redirect"**
→ Vérifiez les URIs de redirection dans Facebook Developer Console

**3. Redirige vers le navigateur**
→ Vérifiez que la section `server.url` est bien retirée du capacitor.config.json

**4. "App not setup: This app is still in development mode"**
→ Passez votre app Facebook en mode "Live" ou ajoutez votre compte comme testeur

## 📚 Ressources

- [Documentation Facebook SDK Android](https://developers.facebook.com/docs/android/)
- [Documentation @capgo/capacitor-social-login](https://github.com/Cap-go/capacitor-social-login)
- [Documentation Capacitor Deep Links](https://capacitorjs.com/docs/guides/deep-links)

## 💡 Notes importantes

1. **Émulateur vs Device réel** : Facebook OAuth peut ne pas fonctionner correctement sur émulateur. Testez toujours sur un device réel.

2. **Mode Développement vs Production** : Le mode "hosted" de Capacitor (avec server.url) est génial pour le développement mais incompatible avec OAuth natif.

3. **Builds séparés** : Vous pouvez créer deux flavors Android (dev/prod) avec des configurations différentes si vous voulez le meilleur des deux mondes.

## ✉️ Support

Si vous rencontrez des problèmes après avoir suivi toutes ces étapes :
1. Vérifiez les logs : `adb logcat`
2. Vérifiez que toutes les valeurs sont correctes dans Facebook Developer Console
3. Assurez-vous que l'app est reconstruite après chaque modification

