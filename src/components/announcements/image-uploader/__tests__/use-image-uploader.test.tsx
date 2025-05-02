
import { renderHook, act } from '@testing-library/react-hooks';
import { useImageUploader } from '../use-image-uploader';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mock dependencies
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } })
      })
    }
  }
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

// Mock for compressImage function
jest.mock('../compression-utils', () => ({
  compressImage: jest.fn().mockImplementation((file) => 
    Promise.resolve(new File(['compressed'], 'compressed.webp', { type: 'image/webp' }))
  )
}));

describe('useImageUploader', () => {
  const mockForm = {
    setValue: jest.fn(),
    getValues: jest.fn().mockReturnValue([])
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct default values', () => {
    mockForm.getValues.mockReturnValueOnce([]);
    
    const { result } = renderHook(() => useImageUploader(mockForm as any));
    
    expect(result.current.uploadedImages).toEqual([]);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.error).toBe(null);
  });

  it('initializes with existing images if present in form', () => {
    const existingImages = ['https://example.com/image1.jpg'];
    mockForm.getValues.mockReturnValueOnce(existingImages);
    
    const { result } = renderHook(() => useImageUploader(mockForm as any));
    
    expect(result.current.uploadedImages).toEqual(existingImages);
  });

  it('removes an image correctly', () => {
    const existingImages = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];
    mockForm.getValues.mockReturnValueOnce(existingImages);
    
    const { result } = renderHook(() => useImageUploader(mockForm as any));
    
    act(() => {
      result.current.removeImage(1);
    });
    
    // Check that form.setValue was called with updated array
    expect(mockForm.setValue).toHaveBeenCalledWith('images', [
      'https://example.com/image1.jpg',
      'https://example.com/image3.jpg'
    ]);
  });
});
