# 📱 Exemple d'implémentation OAuth Facebook côté TypeScript/JavaScript

## Configuration du plugin

Assurez-vous que le plugin `@capgo/capacitor-social-login` est bien installé et configuré dans votre application.

## Code d'exemple

### 1. Import du plugin

```typescript
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';
```

### 2. Initialisation (optionnelle)

```typescript
// Dans votre fichier de configuration ou au démarrage de l'app
async initializeFacebookLogin() {
  try {
    // Le plugin s'initialise automatiquement avec les valeurs de strings.xml
    console.log('Facebook Login ready');
  } catch (error) {
    console.error('Failed to initialize Facebook Login:', error);
  }
}
```

### 3. Fonction de connexion Facebook

```typescript
async loginWithFacebook() {
  try {
    console.log('Starting Facebook login...');
    
    const result = await SocialLogin.login({
      provider: 'facebook',
      options: {
        permissions: ['public_profile', 'email'], // Ajustez selon vos besoins
      }
    });

    console.log('Facebook login successful:', result);
    
    // Le résultat contient :
    // - result.accessToken.token : Le token d'accès Facebook
    // - result.profile : Les informations de profil (nom, email, etc.)
    
    return {
      success: true,
      accessToken: result.accessToken?.token,
      profile: result.profile,
    };
    
  } catch (error) {
    console.error('Facebook login failed:', error);
    return {
      success: false,
      error: error,
    };
  }
}
```

### 4. Fonction de déconnexion

```typescript
async logoutFromFacebook() {
  try {
    await SocialLogin.logout({
      provider: 'facebook'
    });
    console.log('Facebook logout successful');
    return true;
  } catch (error) {
    console.error('Facebook logout failed:', error);
    return false;
  }
}
```

### 5. Vérifier le statut de connexion

```typescript
async checkFacebookLoginStatus() {
  try {
    const result = await SocialLogin.getCurrentUser({
      provider: 'facebook'
    });
    
    if (result.profile) {
      console.log('User is logged in:', result.profile);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Not logged in:', error);
    return false;
  }
}
```

## Exemple complet avec Vue/React/Angular

### Vue 3 Composition API

```typescript
import { ref } from 'vue';
import { SocialLogin } from '@capgo/capacitor-social-login';

export const useFacebookAuth = () => {
  const isLoading = ref(false);
  const user = ref(null);
  const error = ref(null);

  const login = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const result = await SocialLogin.login({
        provider: 'facebook',
        options: {
          permissions: ['public_profile', 'email'],
        }
      });

      user.value = {
        id: result.profile?.id,
        name: result.profile?.name,
        email: result.profile?.email,
        picture: result.profile?.imageUrl,
        accessToken: result.accessToken?.token,
      };

      // Envoyer le token à votre backend pour validation
      await sendTokenToBackend(result.accessToken?.token);
      
      return user.value;
      
    } catch (err) {
      error.value = err;
      console.error('Facebook login error:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      await SocialLogin.logout({ provider: 'facebook' });
      user.value = null;
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return {
    login,
    logout,
    user,
    isLoading,
    error,
  };
};

// Fonction pour envoyer le token à votre backend
async function sendTokenToBackend(token: string) {
  const response = await fetch('https://app.digiibuz.fr/api/auth/facebook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessToken: token }),
  });
  
  if (!response.ok) {
    throw new Error('Backend authentication failed');
  }
  
  return response.json();
}
```

### React Hook

```typescript
import { useState, useCallback } from 'react';
import { SocialLogin } from '@capgo/capacitor-social-login';

export const useFacebookAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await SocialLogin.login({
        provider: 'facebook',
        options: {
          permissions: ['public_profile', 'email'],
        }
      });

      const userData = {
        id: result.profile?.id,
        name: result.profile?.name,
        email: result.profile?.email,
        picture: result.profile?.imageUrl,
        accessToken: result.accessToken?.token,
      };

      setUser(userData);
      
      // Envoyer le token à votre backend
      await sendTokenToBackend(result.accessToken?.token);
      
      return userData;
      
    } catch (err) {
      setError(err);
      console.error('Facebook login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await SocialLogin.logout({ provider: 'facebook' });
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  return {
    login,
    logout,
    user,
    isLoading,
    error,
  };
};
```

## Gestion des erreurs courantes

```typescript
async function handleFacebookLogin() {
  try {
    const result = await SocialLogin.login({
      provider: 'facebook',
      options: {
        permissions: ['public_profile', 'email'],
      }
    });
    
    return result;
    
  } catch (error: any) {
    // L'utilisateur a annulé la connexion
    if (error.message?.includes('cancel') || error.message?.includes('User cancelled')) {
      console.log('Login cancelled by user');
      return null;
    }
    
    // Erreur de configuration
    if (error.message?.includes('Invalid OAuth')) {
      console.error('Facebook OAuth configuration error. Check your Facebook App settings.');
      throw new Error('Configuration Facebook incorrecte');
    }
    
    // Hash de clé manquant
    if (error.message?.includes('key hash')) {
      console.error('Key hash not configured in Facebook Developer Console');
      throw new Error('Hash de clé manquant dans Facebook Developer Console');
    }
    
    // Autre erreur
    console.error('Facebook login error:', error);
    throw error;
  }
}
```

## Tests et débogage

```typescript
// Fonction de test pour vérifier la configuration
async function testFacebookConfiguration() {
  console.log('🧪 Testing Facebook configuration...');
  
  try {
    // Test 1: Vérifier que le plugin est disponible
    if (!SocialLogin) {
      throw new Error('❌ SocialLogin plugin not found');
    }
    console.log('✅ SocialLogin plugin loaded');
    
    // Test 2: Tenter une connexion
    console.log('⏳ Attempting Facebook login...');
    const result = await SocialLogin.login({
      provider: 'facebook',
      options: {
        permissions: ['public_profile'],
      }
    });
    
    console.log('✅ Facebook login successful!');
    console.log('User:', result.profile);
    console.log('Token:', result.accessToken?.token?.substring(0, 20) + '...');
    
    // Test 3: Déconnexion
    await SocialLogin.logout({ provider: 'facebook' });
    console.log('✅ Facebook logout successful!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Facebook configuration test failed:', error);
    return false;
  }
}
```

## Points importants

### 1. Permissions Facebook
Les permissions courantes :
- `public_profile` : Toujours accordée (nom, photo de profil, etc.)
- `email` : Nécessite validation de l'app par Facebook
- `user_friends` : Nécessite validation de l'app par Facebook

### 2. Validation du token côté backend
**Toujours valider le token Facebook côté serveur** :

```typescript
// Exemple d'appel backend
async function validateFacebookToken(accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`
  );
  
  if (!response.ok) {
    throw new Error('Invalid Facebook token');
  }
  
  return response.json();
}
```

### 3. Gestion du cycle de vie

```typescript
import { App } from '@capacitor/app';

// Gérer le retour à l'app après OAuth
App.addListener('appUrlOpen', (data) => {
  console.log('App opened with URL:', data.url);
  
  // Si c'est un callback Facebook
  if (data.url.startsWith('fb') || data.url.includes('callback')) {
    console.log('Facebook OAuth callback received');
  }
});
```

## Ressources supplémentaires

- [Documentation @capgo/capacitor-social-login](https://github.com/Cap-go/capacitor-social-login)
- [Facebook Login for Android](https://developers.facebook.com/docs/facebook-login/android)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/) pour tester les tokens

