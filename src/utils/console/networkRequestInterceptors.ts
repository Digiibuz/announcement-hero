
/**
 * Module pour intercepter et sécuriser les requêtes réseau
 */

/**
 * Configure les interceptions pour XMLHttpRequest et fetch
 */
export function setupNetworkInterceptors(): void {
  // Hook XMLHttpRequest pour masquer les URLs des requêtes
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    // Sauvegarder l'URL originale pour un usage interne mais masquer les logs
    console.log(`Requête XHR ${method} vers [URL_MASQUÉE]`);
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  // Hook fetch pour masquer les URLs des requêtes
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Loguer la requête de manière sécurisée
    const method = init?.method || 'GET';
    console.log(`Requête fetch ${method} vers [URL_MASQUÉE]`);
    
    // Continuer avec la requête fetch originale
    return originalFetch(input, init);
  };
}
