
import { useState, useEffect } from 'react';

export interface NetworkAwareLoadingState {
  isOnline: boolean;
  isSlowNetwork: boolean;
  loadingTime: number;
  loadDuration: number;
  networkQuality: 'slow' | 'normal' | 'unknown';
  showLoading: boolean;
  showSlowNetworkWarning: boolean;
}

/**
 * Hook for providing network-aware loading state
 * Detects network conditions and provides appropriate loading states
 */
export function useNetworkAwareLoading(): NetworkAwareLoadingState {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [loadingTime, setLoadingTime] = useState<number>(0);
  const [loadDuration, setLoadDuration] = useState<number>(0);
  const [isSlowNetwork, setIsSlowNetwork] = useState<boolean>(false);
  
  // Check for online status
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
  
  // Track loading time
  useEffect(() => {
    const startTime = Date.now();
    let timer: number;
    
    // Update loading time every second
    timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setLoadingTime(elapsed);
      setLoadDuration(elapsed);
      
      // Consider network slow after 5 seconds
      if (elapsed > 5 && !isSlowNetwork) {
        setIsSlowNetwork(true);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSlowNetwork]);
  
  // Determine network quality
  const networkQuality = isSlowNetwork ? 'slow' : 'normal';
  
  return {
    isOnline,
    isSlowNetwork,
    loadingTime,
    loadDuration,
    networkQuality,
    showLoading: true,
    showSlowNetworkWarning: isSlowNetwork
  };
}
