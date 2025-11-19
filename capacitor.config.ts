import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.digiibuz.app',
  appName: 'DigiiBuz',
  webDir: 'dist',
  // Commenté pour utiliser le build local sur l'émulateur
  // Décommenter pour le développement avec hot-reload
  // server: {
  //   url: 'https://app.digiibuz.fr?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1f3a',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1f3a'
    }
  },
  // Configuration des App Links pour Android
  // Android interceptera automatiquement les URLs https://app.digiibuz.fr
  // grâce au fichier assetlinks.json hébergé sur le domaine
};

export default config;