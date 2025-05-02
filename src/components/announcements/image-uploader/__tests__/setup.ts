
// Test setup file

// Mock for window network API functions
Object.defineProperty(window, 'isOnSlowNetwork', {
  value: jest.fn().mockReturnValue(false)
});

Object.defineProperty(window, 'getNetworkQuality', {
  value: jest.fn().mockReturnValue('medium')
});

Object.defineProperty(window, 'checkNetworkStatus', {
  value: jest.fn().mockResolvedValue({ type: 'wifi', downlink: 10, rtt: 50 })
});

Object.defineProperty(window, 'isSaveDataEnabled', {
  value: jest.fn().mockReturnValue(false)
});

// Mock for the optimized image component
jest.mock('@/components/ui/optimized-image', () => ({
  OptimizedImage: ({ src, alt, className }) => (
    <img src={src} alt={alt} className={className} />
  )
}));
