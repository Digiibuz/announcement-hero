
import { compressImage } from "../compression-utils";

// Create proper type-safe mocks for HTMLCanvasElement and HTMLImageElement
beforeAll(() => {
  // Mock Canvas API
  const mockContext = {
    drawImage: jest.fn()
  };
  
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockContext as unknown as CanvasRenderingContext2D);
  
  // Mock toBlob
  HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((callback) => {
    const blob = new Blob(['test'], { type: 'image/webp' });
    callback(blob);
  });
  
  // Create a proper mock for Image that aligns with HTMLImageElement
  const originalImage = window.Image;
  // @ts-ignore - we need to override this for tests
  window.Image = class {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    src: string = '';
    width: number = 1000;
    height: number = 800;
    
    constructor() {
      setTimeout(() => {
        this.onload();
      }, 10);
    }
  };

  // Mock FileReader
  const originalFileReader = window.FileReader;
  // @ts-ignore - we need to override for tests
  window.FileReader = class {
    onload: (event: any) => void = () => {};
    onerror: () => void = () => {};
    
    readAsDataURL = jest.fn().mockImplementation(() => {
      setTimeout(() => {
        this.onload({ target: { result: "data:image/jpeg;base64,test" } });
      }, 10);
    });
  };
});

// Cleanup mocks after tests
afterAll(() => {
  jest.restoreAllMocks();
});

describe('compression-utils', () => {
  describe('compressImage', () => {
    it('should compress image on mobile with correct settings', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await compressImage(file, true);
      
      expect(result).toBeDefined();
      expect(result.name).toContain('.webp');
      expect(result.type).toBe('image/webp');
    });
    
    it('should compress image on desktop with correct settings', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await compressImage(file, false);
      
      expect(result).toBeDefined();
      expect(result.name).toContain('.webp');
      expect(result.type).toBe('image/webp');
    });
    
    it('should handle errors during compression', async () => {
      // Override onload to trigger error
      const originalImage = window.Image;
      // @ts-ignore - we need to override for tests
      window.Image = class {
        onload: () => void = () => {};
        onerror: () => void = () => {};
        src: string = '';
        
        constructor() {
          setTimeout(() => {
            this.onerror();
          }, 10);
        }
      };
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await expect(compressImage(file, true)).rejects.toThrow();
      
      // Restore Image constructor
      // @ts-ignore - restoring mock
      window.Image = originalImage;
    });
  });
});
