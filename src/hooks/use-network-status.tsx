
import { useState, useEffect } from 'react';

interface NetworkInfo {
  type: string;
  quality: 'slow' | 'medium' | 'fast';
  downlink: number;
  rtt: number;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    type: 'unknown',
    quality: 'medium',
    downlink: 0,
    rtt: 0
  });

  // Function to update network information
  const updateNetworkInfo = async () => {
    if (window.checkNetworkStatus) {
      const status = await window.checkNetworkStatus();
      setNetworkInfo({
        type: status.type,
        quality: window.getNetworkQuality(),
        downlink: status.downlink,
        rtt: status.rtt
      });
    }
  };

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);
    updateNetworkInfo();

    // Handle connection status changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for network type changes
    const handleNetworkChange = () => {
      updateNetworkInfo();
    };

    window.addEventListener('networkchange', handleNetworkChange);
    
    // Update periodically on slow networks
    let intervalId: NodeJS.Timeout | null = null;
    
    if (window.isOnSlowNetwork && window.isOnSlowNetwork()) {
      intervalId = setInterval(updateNetworkInfo, 10000); // 10s on slow network
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkchange', handleNetworkChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Helper to get color based on quality
  const getQualityColor = () => {
    if (!isOnline) return 'text-destructive';
    
    switch(networkInfo.quality) {
      case 'slow':
        return 'text-amber-500';
      case 'medium':
        return 'text-amber-400';
      case 'fast': 
        return 'text-green-500';
      default:
        return 'text-primary';
    }
  };

  // Get network type label
  const getNetworkTypeLabel = () => {
    if (!isOnline) return 'Hors ligne';
    
    const type = networkInfo.type;
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') {
      // For mobile connections, try to be more precise
      if (networkInfo.quality === 'slow') return 'EDGE/2G';
      if (networkInfo.quality === 'medium') return '3G/H+';
      return '4G/5G';
    }
    
    // Fallback to effectiveType
    if (type === '2g') return 'EDGE/2G';
    if (type === '3g') return '3G/H+';
    if (type === '4g') return '4G/LTE';
    
    return type;
  };

  return {
    isOnline,
    networkInfo,
    getQualityColor,
    getNetworkTypeLabel,
    updateNetworkInfo
  };
}
