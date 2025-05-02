
// Type definitions for window global methods

declare global {
  interface Window {
    clearCacheAndReload: () => void;
    checkNetworkStatus: () => Promise<{
      type: string;
      downlink: number;
      rtt: number;
      saveData: boolean;
    }>;
    getNetworkQuality: () => 'slow' | 'medium' | 'fast';
    isOnSlowNetwork: () => boolean;
    isSaveDataEnabled: () => boolean;
    updateServiceWorker: () => Promise<void>;
  }
}

// Export an empty object to make TypeScript treat this as a module
export {};
