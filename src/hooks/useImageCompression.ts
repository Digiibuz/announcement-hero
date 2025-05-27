import { useState } from "react";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

export const useImageCompression = () => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Check WebP support
  const checkWebPSupport = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  };

  // Lightweight compression for publication
  const compressImage = async (imageUrl: string, options: CompressionOptions = {}): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      setIsCompressing(true);
      setCompressionProgress(0);

      try {
        const {
          maxWidth = 1600,
          maxHeight = 1600,
          quality = 0.8,
          format = 'webp'
        } = options;

        setCompressionProgress(20);

        // Fetch the image
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch image');
        }

        const blob = await response.blob();
        setCompressionProgress(40);

        // Create canvas for compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Cannot create canvas context');
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = async () => {
          try {
            setCompressionProgress(60);

            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            setCompressionProgress(80);

            // Check format support and compress
            const webpSupported = await checkWebPSupport();
            const finalFormat = format === 'webp' && webpSupported ? 'image/webp' : 'image/jpeg';
            
            canvas.toBlob(
              (compressedBlob) => {
                if (!compressedBlob) {
                  reject(new Error('Compression failed'));
                  return;
                }

                const compressedUrl = URL.createObjectURL(compressedBlob);
                setCompressionProgress(100);
                resolve(compressedUrl);
              },
              finalFormat,
              quality
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => reject(new Error('Image load failed'));
        img.src = URL.createObjectURL(blob);
      } catch (error) {
        reject(error);
      } finally {
        setIsCompressing(false);
        setTimeout(() => setCompressionProgress(0), 1000);
      }
    });
  };

  const compressMultipleImages = async (imageUrls: string[], options: CompressionOptions = {}): Promise<string[]> => {
    const compressedUrls: string[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const compressedUrl = await compressImage(imageUrls[i], options);
        compressedUrls.push(compressedUrl);
      } catch (error) {
        console.error(`Failed to compress image ${i + 1}:`, error);
        // Keep original URL if compression fails
        compressedUrls.push(imageUrls[i]);
      }
    }
    
    return compressedUrls;
  };

  return {
    compressImage,
    compressMultipleImages,
    isCompressing,
    compressionProgress
  };
};
