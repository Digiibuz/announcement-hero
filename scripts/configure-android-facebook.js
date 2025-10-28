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
    <string name="facebook_client_token">${FACEBOOK_CLIENT_TOKEN}</string>
    <string name="fb_login_protocol_scheme">fb${FACEBOOK_APP_ID}</string>
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

// Vérifier si la config Facebook existe déjà
if (!manifestContent.includes('com.facebook.sdk.ApplicationId')) {
  // Ajouter les meta-data Facebook et le deep link
  const facebookConfig = `
        <!-- Facebook Configuration -->
        <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
        <meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token"/>
    </application>`;
  
  manifestContent = manifestContent.replace('    </application>', facebookConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (meta-data)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (meta-data)');
}

// Ajouter le deep link pour Facebook callback
if (!manifestContent.includes('app.digiibuz.fr')) {
  const deepLinkConfig = `
            <!-- Deep Links pour Facebook OAuth -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" 
                      android:host="app.digiibuz.fr" 
                      android:pathPrefix="/facebook-callback" />
            </intent-filter>

        </activity>`;
  
  manifestContent = manifestContent.replace('        </activity>', deepLinkConfig);
  fs.writeFileSync(manifestPath, manifestContent);
  console.log('✅ AndroidManifest.xml configuré (deep links)');
} else {
  console.log('ℹ️  AndroidManifest.xml déjà configuré (deep links)');
}

console.log('');
console.log('✅ Configuration Facebook terminée !');
console.log('');
console.log('Prochaines étapes:');
console.log('1. npm run build');
console.log('2. npx cap sync android');
console.log('3. npx cap run android');
