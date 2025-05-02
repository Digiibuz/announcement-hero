
import { compressImage } from "../compression-utils";

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  drawImage: jest.fn(),
});

global.Image = class {
  onload: Function = () => {};
  onerror: Function = () => {};
  src: string = '';
  width = 1000;
  height = 800;
  
  constructor() {
    setTimeout(() => {
      this.onload();
    }, 10);
  }
};

// Mock FileReader
global.FileReader = class {
  onload: Function = () => {};
  onerror: Function = () => {};
  readAsDataURL = jest.fn().mockImplementation(() => {
    setTimeout(() => {
      this.onload({ target: { result: "data:image/jpeg;base64,test" } });
    }, 10);
  });
};

// Mock Canvas toBlob
HTMLCanvasElement.prototype.toBlob = jest.fn().mockImplementation((callback) => {
  const blob = new Blob(['test'], { type: 'image/webp' });
  callback(blob);
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
      const originalImage = global.Image;
      global.Image = class {
        onload: Function = () => {};
        onerror: Function = () => {};
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
      global.Image = originalImage;
    });
  });
});
