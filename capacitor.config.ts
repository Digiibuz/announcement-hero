import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.digiibuz.app',
  appName: 'DigiiBuz',
  webDir: 'dist',
  server: {
    url: 'https://app.digiibuz.fr?forceHideBadge=true',
    cleartext: true
  },
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
  android: {
    // Configuration du scheme personnalisé pour les deep links
    scheme: 'digiibuz'
  }
};

export default config;