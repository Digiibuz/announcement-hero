
import { useState, useEffect } from 'react';

export const useServiceWorker = () => {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
      
      // Check for updates every 5 minutes (optionnel maintenant car auto-reload)
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
      
      console.log('Service Worker registered successfully with auto-reload');

      // Check for updates immediately
      checkForUpdatesWithRegistration(reg);

      // Listen for updatefound events - auto-reload will handle updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New version detected - auto-reload will occur');
              } else {
                console.log('Content is cached for offline use');
              }
            }
          });
        }
      });

      // Listen for controller changes (new SW takes control) - auto-reload
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - auto-reload');
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const checkForUpdatesWithRegistration = async (reg: ServiceWorkerRegistration) => {
    try {
      await reg.update();
      
      // If there's a waiting worker, it will auto-reload
      if (reg.waiting) {
        console.log('Update available - will auto-reload');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  const checkForUpdates = async () => {
    if (registration) {
      await checkForUpdatesWithRegistration(registration);
    }
  };

  const getVersion = () => {
    return '1.2.6';
  };

  const getBuildDate = () => {
    return new Date().toLocaleDateString('fr-FR');
  };

  return {
    checkForUpdates,
    getVersion,
    getBuildDate
  };
};
