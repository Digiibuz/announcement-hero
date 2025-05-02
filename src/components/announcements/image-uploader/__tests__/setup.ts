
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
global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  callback: IntersectionObserverCallback;
}

global.IntersectionObserver = IntersectionObserverMock;

// Mock network status functions
window.isOnSlowNetwork = jest.fn().mockReturnValue(false);
window.isSaveDataEnabled = jest.fn().mockReturnValue(false);
window.getNetworkQuality = jest.fn().mockReturnValue('medium');
