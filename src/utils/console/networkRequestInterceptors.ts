
/**
 * Module pour intercepter et remplacer complètement les requêtes réseau avec des URLs factices
 */
import { setupFetchInterceptor } from './fetchInterceptor';
import { setupXHRInterceptor } from './xhrInterceptor';
import { setupErrorListeners } from './errorListeners';
import { setupDevToolsProtection } from './devToolsProtection';

/**
 * Configure les interceptions pour XMLHttpRequest et fetch pour remplacer complètement les URLs
 */
export function setupNetworkInterceptors(): void {
  // Configurer les différents intercepteurs
  setupFetchInterceptor();
  setupXHRInterceptor();
  setupErrorListeners();
  setupDevToolsProtection();
}

// Initialiser immédiatement les intercepteurs
setupNetworkInterceptors();
