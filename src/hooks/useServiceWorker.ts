import { useState, useEffect } from 'react';

export const useServiceWorker = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
      
      // Check for updates every 5 minutes
      const updateInterval = setInterval(() => {
        checkForUpdates();
      }, 5 * 60 * 1000);

      return () => clearInterval(updateInterval);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      console.log('Service Worker registered successfully');

      // Check for updates immediately
      checkForUpdatesWithRegistration(reg);

      // Listen for updatefound events
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New version available');
                setUpdateAvailable(true);
              } else {
                console.log('Content is cached for offline use');
              }
            }
          });
        }
      });

      // Listen for messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('Update notification received from SW:', event.data.version);
          setUpdateAvailable(true);
        }
      });

      // Listen for controller changes (new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        setUpdateAvailable(true);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const checkForUpdatesWithRegistration = async (reg: ServiceWorkerRegistration) => {
    try {
      await reg.update();
      
      // If there's a waiting worker, update is available
      if (reg.waiting) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const updateApp = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Force reload to get the new version
    window.location.reload();
  };

  const checkForUpdates = async () => {
    if (registration) {
      await checkForUpdatesWithRegistration(registration);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  const getVersion = () => {
    return '1.2.6';
  };

  const getBuildDate = () => {
    return new Date().toLocaleDateString('fr-FR');
  };

  return {
    updateAvailable,
    updateApp,
    checkForUpdates,
    dismissUpdate,
    setUpdateAvailable,
    getVersion,
    getBuildDate
  };
};
