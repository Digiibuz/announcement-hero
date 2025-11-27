# Configuration des permissions iOS pour DigiiBuz

## Problème identifié
L'app crash sur iPad Air 11-inch (M2) iPadOS 26.1 lors de l'ajout d'une photo avec la caméra.

## Cause
Permissions caméra manquantes dans Info.plist

## Solution

### 1. Après git pull, recréer le projet iOS :
```bash
cd /chemin/vers/votre/projet
git pull origin main
npm install
npm run build
npx cap add ios
npx cap sync ios
```

### 2. Ouvrir le projet dans Xcode :
```bash
npx cap open ios
```

### 3. Ajouter manuellement les permissions dans Info.plist :

Ouvrir `ios/App/App/Info.plist` et ajouter ces clés :

```xml
<key>NSCameraUsageDescription</key>
<string>DigiiBuz a besoin d'accéder à votre appareil photo pour ajouter des photos à vos annonces.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>DigiiBuz a besoin d'accéder à vos photos pour sélectionner des images pour vos annonces.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>DigiiBuz souhaite enregistrer des photos dans votre bibliothèque.</string>

<key>NSMicrophoneUsageDescription</key>
<string>DigiiBuz a besoin d'accéder au microphone pour enregistrer des vidéos.</string>
```

### 4. Mettre à jour la version dans Xcode :
- Sélectionner le projet DigiiBuz dans le navigateur
- Dans l'onglet General :
  - Version: `1.4`
  - Build: `4` (incrémenter de 1)

### 5. Créer l'archive et soumettre :
```
Product → Archive
Distribute App → App Store Connect
Upload
```

### 6. Notes pour Apple :

**Version 1.4 - Corrections**

Correction du crash lors de l'utilisation de la caméra :
- Ajout des permissions iOS manquantes (NSCameraUsageDescription, NSPhotoLibraryUsageDescription)
- Amélioration de la gestion des erreurs de permission caméra
- Vérification des permissions avant l'ouverture de la caméra

Cette version corrige le problème signalé dans la review précédente (crash lors de l'ajout de photo avec la caméra sur iPad Air).

**Identifiants de test :**
- Email: test@digiibuz.fr
- Mot de passe: Test123456!
- Rôle: testeur (utilise des données de test pour éviter les blocages réseau)

**Instructions de test :**
1. Se connecter avec les identifiants ci-dessus
2. Créer une nouvelle annonce
3. Cliquer sur "Appareil photo" pour ajouter une image
4. L'app devrait demander la permission et ouvrir la caméra sans crash

---

## Changements techniques apportés

### capacitor.config.ts
- Ajout de `ios.contentInset: 'always'` pour une meilleure gestion des zones sécurisées

### ImageManagement.tsx
- Vérification proactive des permissions caméra via `navigator.mediaDevices.getUserMedia()`
- Gestion d'erreur explicite avec message utilisateur clair
- Test de permission avant déclenchement de l'input caméra

Ces changements garantissent que l'utilisateur soit informé clairement si les permissions sont refusées, au lieu de faire crasher l'app.
