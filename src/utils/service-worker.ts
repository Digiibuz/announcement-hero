
// Service Worker registration and management utilities

// Variable to track service worker registration
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

// Function to register service worker with retry logic
export const registerServiceWorker = async (retryCount = 3): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      // Ensure no service worker is pending or installing
      const existingReg = await navigator.serviceWorker.getRegistration();
      if (existingReg) {
        console.log('Service worker already registered, attempting update...');
        await existingReg.update();
      }
      
      // New registration with delay to avoid conflicts
      return new Promise<ServiceWorkerRegistration | null>((resolve) => {
        setTimeout(async () => {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
              updateViaCache: 'none'
            });
            
            console.log('SW registered successfully:', registration);
            serviceWorkerRegistration = registration;
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  console.log('SW state:', newWorker.state);
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('A new version of the service worker is available');
                    
                    // If page is visible, offer reload
                    if (document.visibilityState === 'visible') {
                      // Create notification to inform user
                      if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Application updated', {
                          body: 'A new version is available. Reload the page to use it.'
                        });
                      }
                    }
                  }
                });
              }
            });
            
            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
              if (event.data) {
                if (event.data.type === 'cacheCleared') {
                  console.log('Cache has been cleared, reloading page...');
                  window.location.reload();
                } else if (event.data.type === 'networkStatus') {
                  console.log('Cache status:', event.data);
                }
              }
            });
            
            resolve(registration);
          } catch (innerError) {
            console.error('Failed to register SW during delayed attempt:', innerError);
            resolve(null);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('SW registration error:', error);
      
      // Retry with exponential backoff
      if (retryCount > 0) {
        const delay = Math.pow(2, 4 - retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Retrying SW registration in ${delay}ms...`);
        
        return new Promise<ServiceWorkerRegistration | null>((resolve) => {
          setTimeout(() => {
            resolve(registerServiceWorker(retryCount - 1));
          }, delay);
        });
      }
    }
  }
  return null;
};

// Function to trigger service worker update
export const updateServiceWorker = async (): Promise<void> => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('Updating service worker...');
        await registration.update();
      }
    } catch (error) {
      console.error('Error updating SW:', error);
    }
  }
};

// Function to clear cache and reload
export const clearCacheAndReload = (): void => {
  if (serviceWorkerRegistration && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('clearCache');
  } else {
    window.location.reload();
  }
};

// Export service worker registration for external use
export { serviceWorkerRegistration };
