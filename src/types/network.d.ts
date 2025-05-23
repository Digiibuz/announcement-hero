
// Type definitions for network-related functionality
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
}
