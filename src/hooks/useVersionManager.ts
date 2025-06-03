
import { useState, useEffect } from 'react';

export const useVersionManager = () => {
  const [version, setVersion] = useState<string>('1.2.2');

  useEffect(() => {
    // Charger la version depuis le localStorage au démarrage
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion) {
      setVersion(savedVersion);
    }
  }, []);

  const updateVersion = (newVersion: string) => {
    setVersion(newVersion);
    localStorage.setItem('app_version', newVersion);
  };

  return {
    version,
    updateVersion
  };
};
