
/**
 * Module pour protéger contre l'affichage d'informations sensibles dans le DOM
 */
import { CRITICAL_URLS_TO_BLOCK } from './constants';

/**
 * Configure la protection DOM pour masquer les éléments du réseau dans l'interface de développement
 */
export function setupDOMProtection(): void {
  // Vérification périodique pour intercepter les requêtes qui auraient pu passer
  setInterval(() => {
    // Masquer les éléments du réseau dans l'interface de développement
    try {
      const networkItems = document.querySelectorAll('[data-testid="network-item"]');
      networkItems.forEach((item: any) => {
        const text = item.textContent || '';
        if (CRITICAL_URLS_TO_BLOCK.some(pattern => text.includes(pattern))) {
          item.style.display = 'none';
        }
      });
    } catch (e) {
      // Ignorer les erreurs silencieusement
    }
  }, 100);
}
