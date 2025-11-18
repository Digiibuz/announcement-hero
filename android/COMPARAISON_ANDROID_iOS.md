# 🔄 Comparaison OAuth Facebook : Android vs iOS

## ✅ CE QUI EST IDENTIQUE

### 1. Code TypeScript/JavaScript
```typescript
// Ce code fonctionne sur ANDROID ET iOS sans modification !
import { SocialLogin } from '@capgo/capacitor-social-login';

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

### 2. Configuration Facebook Developer Console
- ✅ Même Facebook App ID
- ✅ Même Client Token
- ✅ Mêmes permissions demandées
- ✅ URIs de redirection OAuth similaires

### 3. Problème du mode "hosted"
- ❌ Sur Android : redirige vers Chrome
- ❌ Sur iOS : redirige vers Safari
- ✅ Solution identique : **retirer `server.url` de capacitor.config.json**

### 4. Package/Bundle ID
- Recommandé d'utiliser le même : `com.digiibuz.app`

---

## 🔄 CE QUI DIFFÈRE

| Aspect | 🤖 Android | 🍎 iOS |
|--------|-----------|---------|
| **Fichier de config principal** | `AndroidManifest.xml` | `Info.plist` |
| **Valeurs Facebook** | `strings.xml` | `Info.plist` |
| **URL Schemes** | Intent Filters dans manifest | CFBundleURLTypes dans plist |
| **Hash de clé** | ✅ Requis (keytool) | ❌ Non requis |
| **IDE** | Android Studio | Xcode (Mac uniquement) |
| **Émulateur OAuth** | ✅ Fonctionne généralement bien | ⚠️ Peut être instable |
| **Certificats** | Debug keystore automatique | Certificat Apple Developer requis pour distribution |
| **Store** | Google Play | App Store (review plus strict) |
| **Build commande** | `./gradlew assembleDebug` | Build via Xcode |

---

## 📋 CHECKLIST COMPLÈTE MULTI-PLATEFORME

### Configuration Facebook Developer Console

#### Paramètres généraux (une fois)
- [ ] Facebook App créée
- [ ] App ID et Client Token notés
- [ ] App en mode "Development" ou "Live"

#### Plateforme Android
- [ ] Plateforme Android ajoutée
- [ ] Package : `com.digiibuz.app`
- [ ] Classe : `com.digiibuz.app.MainActivity`
- [ ] Hash de clé ajouté (keytool)

#### Plateforme iOS
- [ ] Plateforme iOS ajoutée
- [ ] Bundle ID : `com.digiibuz.app`
- [ ] Team ID Apple Developer (si disponible)

#### URIs de redirection OAuth
- [ ] `https://app.digiibuz.fr/callback`
- [ ] `fb[APP_ID]://authorize/`
- [ ] `com.digiibuz.app://callback` (optionnel)

---

### Configuration Android

- [ ] AndroidManifest.xml : Meta-data Facebook
- [ ] AndroidManifest.xml : Activités Facebook
- [ ] AndroidManifest.xml : Intent filters
- [ ] strings.xml : facebook_app_id
- [ ] strings.xml : facebook_client_token
- [ ] strings.xml : fb_login_protocol_scheme
- [ ] capacitor.config.json : server.url retiré
- [ ] Build : `./gradlew clean assembleDebug`
- [ ] Test sur device Android réel

---

### Configuration iOS

- [ ] Projet iOS initialisé : `npx cap add ios`
- [ ] Info.plist : FacebookAppID
- [ ] Info.plist : FacebookClientToken
- [ ] Info.plist : FacebookDisplayName
- [ ] Info.plist : CFBundleURLTypes (fb[APP_ID])
- [ ] Info.plist : LSApplicationQueriesSchemes
- [ ] Xcode : Bundle Identifier = com.digiibuz.app
- [ ] capacitor.config.json : server.url retiré
- [ ] Build via Xcode
- [ ] Test sur device iOS réel

---

## 🚀 COMMANDES ESSENTIELLES

### Android
```bash
# Build
cd android
./gradlew clean
./gradlew assembleDebug

# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Logs
adb logcat | grep -i facebook
```

### iOS
```bash
# Setup
npx cap add ios
npx cap sync ios

# Open Xcode
npx cap open ios

# Puis dans Xcode : ▶️ (Play button)

# Logs (dans Xcode console ou Terminal)
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "DigiiBuz"'
```

### Les deux
```bash
# Synchroniser après modifications du code web
npx cap sync

# Copier les assets uniquement
npx cap copy
```

---

## 🎯 STRATÉGIES DE DÉVELOPPEMENT

### Option 1 : Mode Hosted pour Dev
**Avantages** :
- Développement rapide (hot reload)
- Pas besoin de rebuild natif à chaque changement

**Inconvénients** :
- OAuth ne fonctionne pas
- Pas représentatif de la prod

**Quand l'utiliser** :
- Phase de développement UI/UX
- Features sans OAuth

### Option 2 : Mode Native pour Prod
**Avantages** :
- OAuth fonctionne
- Performance native
- Prêt pour les stores

**Inconvénients** :
- Rebuild nécessaire à chaque changement
- Plus lent à itérer

**Quand l'utiliser** :
- Test des features OAuth
- Builds de production
- Soumission aux stores

### Option 3 : Configuration séparée (RECOMMANDÉ)
Créer deux fichiers de config :
- `capacitor.config.dev.json` (avec server.url)
- `capacitor.config.prod.json` (sans server.url)

```bash
# Pour dev
cp capacitor.config.dev.json capacitor.config.json
npx cap sync

# Pour prod
cp capacitor.config.prod.json capacitor.config.json
npx cap sync
```

---

## 📱 DIFFÉRENCES DE COMPORTEMENT OAUTH

### Android
```
1. User clique "Login Facebook"
2. App ouvre Facebook app (ou WebView si pas installée)
3. User autorise
4. Facebook redirige vers fb[APP_ID]://
5. Intent Filter capture l'URL
6. App reprend le contrôle
7. Plugin traite le callback
```

### iOS
```
1. User clique "Login Facebook"
2. App ouvre Facebook app (ou SafariViewController)
3. User autorise
4. Facebook redirige vers fb[APP_ID]://
5. URL Scheme capture l'URL
6. App reprend le contrôle
7. Plugin traite le callback
```

**→ Le plugin gère ces différences automatiquement !**

---

## ⚠️ PIÈGES COURANTS

### Piège #1 : Mode Hosted oublié
**Symptôme** : OAuth ouvre le navigateur
**Solution** : Retirer `server.url` de capacitor.config.json

### Piège #2 : Hash de clé Android incorrect
**Symptôme** : "Can't load URL" sur Android
**Solution** : Régénérer et reconfigurer le hash de clé

### Piège #3 : URL Scheme mal configuré iOS
**Symptôme** : "Can't open URL" sur iOS
**Solution** : Vérifier CFBundleURLTypes dans Info.plist

### Piège #4 : Tester sur émulateur/simulateur
**Symptôme** : Comportement imprévisible
**Solution** : **Toujours tester sur vrais devices**

### Piège #5 : Oublier de sync après changement
**Symptôme** : Changements pas reflétés dans l'app
**Solution** : Toujours faire `npx cap sync` après modification

---

## 🏆 BEST PRACTICES

### 1. Versioning
Gardez le même numéro de version sur Android et iOS :
```json
// capacitor.config.json
{
  "version": "1.0.0"
}
```

### 2. Configuration centralisée
Utilisez des variables d'environnement :
```typescript
// config.ts
export const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
```

### 3. Gestion des erreurs unifiée
```typescript
async loginWithFacebook() {
  try {
    const result = await SocialLogin.login({...});
    return { success: true, data: result };
  } catch (error) {
    // Même gestion d'erreur sur iOS et Android
    return { success: false, error: error.message };
  }
}
```

### 4. Feature flags
```typescript
const FEATURES = {
  FACEBOOK_LOGIN: !IS_HOSTED_MODE,
  // Désactiver OAuth en mode hosted
};
```

---

## 📊 RÉSUMÉ VISUEL

```
┌─────────────────────────────────────────────────┐
│         Facebook Developer Console              │
│  (Configuration commune iOS + Android)          │
│                                                 │
│  • App ID: 1234567890                          │
│  • Client Token: abc123...                     │
│  • URIs OAuth: app.digiibuz.fr/callback        │
└────────────┬───────────────────┬────────────────┘
             │                   │
     ┌───────▼────────┐  ┌──────▼─────────┐
     │    ANDROID     │  │      iOS       │
     │                │  │                │
     │ strings.xml    │  │ Info.plist     │
     │ AndroidManif   │  │ CFBundleURL    │
     │ Intent Filter  │  │ URL Schemes    │
     │ keytool hash   │  │ (pas de hash)  │
     └───────┬────────┘  └──────┬─────────┘
             │                   │
             └────────┬──────────┘
                      │
          ┌───────────▼────────────┐
          │  capacitor.config.json │
          │  (SANS server.url)     │
          └───────────┬────────────┘
                      │
          ┌───────────▼────────────┐
          │   Code TypeScript      │
          │   (identique !)        │
          │  @capgo/social-login   │
          └────────────────────────┘
```

---

## ✅ VALIDATION FINALE

### Test Android
```bash
✓ Ouvre l'app Facebook native
✓ Autorise l'application
✓ Revient à DigiiBuz automatiquement
✓ User connecté avec profil affiché
```

### Test iOS
```bash
✓ Ouvre l'app Facebook native
✓ Autorise l'application
✓ Revient à DigiiBuz automatiquement
✓ User connecté avec profil affiché
```

### Si ça ne marche pas
1. Vérifier que `server.url` est bien retiré
2. Vérifier les valeurs Facebook (App ID, Token)
3. Vérifier les URL Schemes / Intent Filters
4. Vérifier les URIs de redirection dans Facebook Console
5. Tester sur un VRAI device, pas émulateur

---

**🎉 Avec cette configuration, votre OAuth Facebook fonctionnera sur Android ET iOS !**

