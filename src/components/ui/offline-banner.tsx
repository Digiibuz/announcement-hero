
import { useState, useEffect } from 'react';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Surveillance de l'état de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
      <span className="font-medium">Mode hors ligne activé</span> - Certaines fonctionnalités sont limitées
    </div>
  );
};
