
// Utilitaires pour le Service Worker

// Vérification qu'une URL est valide pour la mise en cache
function isValidCacheUrl(url) {
  const validSchemes = ['http:', 'https:'];
  try {
    const urlObj = new URL(url);
    return validSchemes.includes(urlObj.protocol);
  } catch (e) {
    return false;
  }
}

// Déterminer si une URL est un asset statique qui peut être mis en cache
function isStaticAsset(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.pathname.endsWith('.css') ||
      urlObj.pathname.endsWith('.woff2') ||
      urlObj.pathname.endsWith('.png') ||
      urlObj.pathname.endsWith('.svg') ||
      urlObj.pathname.endsWith('.jpg') ||
      urlObj.pathname.endsWith('.webp') ||
      urlObj.pathname.endsWith('.avif') ||
      urlObj.pathname.endsWith('.ico')
    );
  } catch (e) {
    return false;
  }
}

// Ne jamais mettre en cache ces types de fichiers
function shouldSkipCaching(url) {
  try {
    const urlObj = new URL(url);
    
    // Login module specifically should not be cached
    if (url.includes('Login-') || url.includes('login')) {
      console.log('Skipping cache for login resource:', url);
      return true;
    }
    
    // Ne jamais mettre en cache les ressources JavaScript
    if (urlObj.pathname.endsWith('.js')) {
      return true;
    }
    
    return (
      urlObj.pathname.endsWith('.ts') || 
      urlObj.pathname.endsWith('.tsx') || 
      url.includes('assets/') ||
      url.includes('/api/') || 
      url.includes('supabase.co') || 
      url.includes('wp-json') ||
      url.includes('storage.googleapis.com') ||
      url.includes('camera') ||
      url.includes('image/') ||
      url.includes('upload') ||
      url.includes('media') ||
      url.includes('openai.com') ||
      url.includes('login') ||   // Ne jamais mettre en cache la page de login
      url.includes('dashboard') || // Ni les pages qui nécessitent une authentification
      !isValidCacheUrl(url)
    );
  } catch (e) {
    return true;
  }
}

export {
  isValidCacheUrl,
  isStaticAsset,
  shouldSkipCaching
};
