
/**
 * Module pour gérer les erreurs globales et les rejets de promesses
 * avec une approche plus agressive de remplacement d'URLs
 */
import { setupConsoleOverrides } from './consoleOverrides';
import { setupErrorPrototypeOverrides } from './errorOverrides';
import { setupGlobalListeners } from './globalListeners';

/**
 * Configure les écouteurs d'événements pour les erreurs globales
 * et remplace toutes les URLs sensibles
 */
export function setupGlobalErrorHandlers(): void {
  // Mettre en place les remplacements de console
  setupConsoleOverrides();
  
  // Mettre en place les remplacements de prototype d'erreur
  setupErrorPrototypeOverrides();
  
  // Mettre en place les écouteurs d'événements globaux
  setupGlobalListeners();
}

// Initialiser automatiquement
setupGlobalErrorHandlers();
