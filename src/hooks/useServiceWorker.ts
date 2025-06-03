
import { useState, useEffect } from 'react';

export const useServiceWorker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      console.log('Service Worker registered successfully');

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available');
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
        }
      });

      // Check for existing updates
      if (reg.waiting) {
        setUpdateAvailable(true);
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const checkForUpdates = () => {
    if (registration) {
      registration.update();
    }
    // Also send message to SW to force check
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
    }
  };

  return {
    updateAvailable,
    updateApp,
    checkForUpdates,
    setUpdateAvailable
  };
};
