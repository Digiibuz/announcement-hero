
// Application initialization utilities

import { registerServiceWorker, updateServiceWorker, clearCacheAndReload } from './service-worker';
import { 
  checkNetworkStatus, 
  getNetworkQuality, 
  isOnSlowNetwork, 
  isSaveDataEnabled,
  startNetworkMonitoring 
} from './network-monitoring';
import { setupVisibilityChangeHandler } from './page-reload';

// Initialize application with all required functionality
export const initializeApp = (): void => {
  // Configuration to avoid full reloads
  if ('scrollRestoration' in history) {
    // Use 'manual' instead of 'auto' to prevent automatic scrolling on reload
    history.scrollRestoration = 'manual';
  }
  
  // Attach global methods to window object
  window.clearCacheAndReload = clearCacheAndReload;
  window.checkNetworkStatus = checkNetworkStatus;
  window.getNetworkQuality = getNetworkQuality;
  window.isOnSlowNetwork = isOnSlowNetwork;
  window.isSaveDataEnabled = isSaveDataEnabled;
  window.updateServiceWorker = updateServiceWorker;
  
  // Register the service worker on load with delay to ensure page is fully loaded
  window.addEventListener('load', () => {
    setTimeout(() => {
      registerServiceWorker();
      startNetworkMonitoring();
    }, 2000);
  });
  
  // Set up visibility change handler
  setupVisibilityChangeHandler();
};
