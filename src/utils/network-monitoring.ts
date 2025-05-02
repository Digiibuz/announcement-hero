
// Network monitoring utilities

// Function to check network status with improved typing
export const checkNetworkStatus = async (): Promise<{
  type: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}> => {
  // Obtain connection information from the Network Information API
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection) {
    // Try to get the specific connection type (not available in all browsers)
    const networkType = connection.type || connection.effectiveType || 'unknown';
    
    return {
      type: networkType,
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  
  // Fallback if the Network Information API is not available
  return {
    type: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
};

// Utility to classify network quality
export const getNetworkQuality = (): 'slow' | 'medium' | 'fast' => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) return 'medium'; // Default
  
  // Classification based on effective type or downlink/rtt combination
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '2g' || connection.downlink < 0.5 || connection.rtt > 600) {
    return 'slow';
  } else if (effectiveType === '3g' || connection.downlink < 2 || connection.rtt > 300) {
    return 'medium';
  } else {
    return 'fast';
  }
};

// Check if user is on a slow network (2G/EDGE or equivalent)
export const isOnSlowNetwork = (): boolean => {
  return getNetworkQuality() === 'slow';
};

// Check if data saver mode is enabled
export const isSaveDataEnabled = (): boolean => {
  const connection = (navigator as any).connection;
  return connection ? connection.saveData === true : false;
};

// Start monitoring network status
export const startNetworkMonitoring = (): void => {
  // Check network status immediately
  window.checkNetworkStatus();
  
  // Set up periodic adaptive checking
  let networkStatusCheckInterval: number | null = null;
  
  if (networkStatusCheckInterval === null) {
    // Check more frequently on unstable/slow networks
    const checkFrequency = window.isOnSlowNetwork() ? 10000 : 30000; // 10s for slow networks, 30s otherwise
    
    networkStatusCheckInterval = window.setInterval(() => {
      window.checkNetworkStatus();
    }, checkFrequency);
  }
  
  // Monitor connection changes (if API available)
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', () => {
      window.checkNetworkStatus();
    });
  }
  
  // Monitor online/offline state
  window.addEventListener('online', () => {
    console.log('Connection restored');
    window.dispatchEvent(new CustomEvent('connectionchange', { detail: { online: true } }));
    // Synchronize pending data if needed
  });
  
  window.addEventListener('offline', () => {
    console.log('Connection lost');
    window.dispatchEvent(new CustomEvent('connectionchange', { detail: { online: false } }));
  });
};
