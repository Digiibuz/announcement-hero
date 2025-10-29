#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const FACEBOOK_APP_ID = '329464176919950';
const FACEBOOK_CLIENT_TOKEN = 'f22cceee2ca93c8e6871b31fccc1d0d2';

console.log('🔧 Configuration Facebook pour Android...');

// Chemins des fichiers
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
const stringsPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

// Vérifier que le dossier android existe
if (!fs.existsSync(path.join(__dirname, '..', 'android'))) {
  console.error('❌ Le dossier android n\'existe pas. Exécutez d\'abord: npx cap add android');
  process.exit(1);
}

// Configurer strings.xml
console.log('📝 Configuration de strings.xml...');
let stringsContent = fs.readFileSync(stringsPath, 'utf8');

// Vérifier si les valeurs Facebook existent déjà
if (!stringsContent.includes('facebook_app_id')) {
  // Ajouter les valeurs Facebook avant la balise fermante </resources>
  const facebookStrings = `
    <!-- Facebook Configuration -->
    <string name="facebook_app_id">${FACEBOOK_APP_ID}</string>
    <string name="fb_login_protocol_scheme">fb${FACEBOOK_APP_ID}</string>
    <string name="facebook_client_token">${FACEBOOK_CLIENT_TOKEN}</string>
</resources>`;
  
  stringsContent = stringsContent.replace('</resources>', facebookStrings);
  fs.writeFileSync(stringsPath, stringsContent);
  console.log('✅ strings.xml configuré');
} else {
  console.log('ℹ️  strings.xml déjà configuré');
}

// Configurer AndroidManifest.xml
console.log('📝 Configuration de AndroidManifest.xml...');
let manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Ajouter les queries pour Facebook si nécessaire
if (!manifestContent.includes('<queries>')) {
  const queriesConfig = `
    <!-- Package visibility pour Facebook SDK -->
    <queries>
        <package android:name="com.facebook.katana" />
        <package android:name="com.facebook.orca" />
        <package android:name="com.facebook.lite" />
    </queries>

    <application`;
  
  manifestContent = manifestContent.replace('    <application', queriesConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (queries)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (queries)');
}

// Recharger le contenu après modification
manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Ajouter les meta-data Facebook
if (!manifestContent.includes('com.facebook.sdk.ApplicationId')) {
  const metaDataConfig = `
        <!-- Facebook Configuration -->
        <meta-data 
            android:name="com.facebook.sdk.ApplicationId" 
            android:value="@string/facebook_app_id"/>
        
        <meta-data 
            android:name="com.facebook.sdk.ClientToken" 
            android:value="@string/facebook_client_token"/>

        <activity`;
  
  manifestContent = manifestContent.replace(/\s+<activity/, metaDataConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (meta-data)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (meta-data)');
}

// Recharger le contenu après modification
manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Ajouter le custom URL scheme pour Facebook
if (!manifestContent.includes('fb_login_protocol_scheme')) {
  const customUrlSchemeConfig = `
            <!-- Custom URL scheme pour Facebook -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="@string/fb_login_protocol_scheme" />
            </intent-filter>

        </activity>`;
  
  manifestContent = manifestContent.replace(/\s+<\/activity>/, customUrlSchemeConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (custom URL scheme)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (custom URL scheme)');
}

// Recharger le contenu après modification
manifestContent = fs.readFileSync(manifestPath, 'utf8');

// Ajouter FacebookActivity
if (!manifestContent.includes('com.facebook.FacebookActivity')) {
  const facebookActivityConfig = `
        <!-- Facebook Activity -->
        <activity 
            android:name="com.facebook.FacebookActivity"
            android:configChanges="keyboard|keyboardHidden|screenLayout|screenSize|orientation"
            android:label="@string/app_name" />

    </application>`;
  
  manifestContent = manifestContent.replace('    </application>', facebookActivityConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (FacebookActivity)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (FacebookActivity)');
}

console.log('');
console.log('✅ Configuration Facebook terminée !');
console.log('');
console.log('Prochaines étapes:');
console.log('1. npm run build');
console.log('2. npx cap sync android');
console.log('3. npx cap run android');
