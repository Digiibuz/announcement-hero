
// Test environment setup for image uploader tests
import '@testing-library/jest-dom';

// Mock window.URL.createObjectURL
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob-url'),
    revokeObjectURL: jest.fn()
  },
  writable: true
});

// Mock for ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

// Add to global
// @ts-ignore - for testing purposes
window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver with appropriate type definition
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

// @ts-ignore - for testing purposes
window.IntersectionObserver = mockIntersectionObserver;

// Mock network status functions
// @ts-ignore - adding test properties to window
window.isOnSlowNetwork = jest.fn().mockReturnValue(false);
// @ts-ignore - adding test properties to window
window.isSaveDataEnabled = jest.fn().mockReturnValue(false);
// @ts-ignore - adding test properties to window
window.getNetworkQuality = jest.fn().mockReturnValue('medium');
