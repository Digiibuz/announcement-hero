
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
              console.log('New version available - Auto updating...');
              setUpdateAvailable(true);
              // Auto-update after a short delay
              setTimeout(() => {
                updateApp();
              }, 2000);
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
          // Auto-update after a short delay
          setTimeout(() => {
            updateApp();
          }, 2000);
        }
      });

      // Check for existing updates
      if (reg.waiting) {
        setUpdateAvailable(true);
        setTimeout(() => {
          updateApp();
        }, 2000);
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
  };

  const getVersion = () => {
    return import.meta.env.MODE === 'development' ? 'dev' : '1.0.2';
  };

  const getBuildDate = () => {
    return new Date().toLocaleDateString('fr-FR');
  };

  return {
    updateAvailable,
    updateApp,
    checkForUpdates,
    setUpdateAvailable,
    getVersion,
    getBuildDate
  };
};
