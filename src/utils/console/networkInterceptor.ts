
/**
 * Module principal pour intercepter toutes les requêtes réseau et masquer complètement les URLs sensibles
 */
import { setupFetchInterceptor } from './fetchInterceptor';
import { setupXHRInterceptor } from './xhrInterceptor';
import { setupDOMProtection } from './domProtection';

/**
 * Configure les interceptions pour fetch et XMLHttpRequest
 */
export function setupNetworkInterceptors(): void {
  setupFetchInterceptor();
  setupXHRInterceptor();
  setupDOMProtection();
}

// Initialiser les intercepteurs immédiatement
setupNetworkInterceptors();

// Exporter pour utilisation ailleurs
export default setupNetworkInterceptors;
