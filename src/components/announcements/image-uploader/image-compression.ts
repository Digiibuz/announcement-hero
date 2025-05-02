
interface CompressionSettings {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

// Optimized image compression adapted to network quality
export const compressAndConvertToWebp = async (
  file: File,
  settings: CompressionSettings
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > settings.maxWidth) {
              height *= settings.maxWidth / width;
              width = settings.maxWidth;
            }
          } else {
            if (height > settings.maxHeight) {
              width *= settings.maxHeight / height;
              height = settings.maxHeight;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error("Impossible de créer le contexte canvas"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(blob => {
            if (!blob) {
              reject(new Error("La conversion a échoué"));
              return;
            }
            
            const fileName = file.name.split('.')[0] + '.webp';
            const newFile = new File([blob], fileName, {
              type: 'image/webp'
            });
            resolve(newFile);
          }, 'image/webp', settings.quality);
        } catch (error) {
          console.error("Erreur lors de la compression:", error);
          reject(error);
        }
      };
      img.onerror = () => {
        reject(new Error("Erreur lors du chargement de l'image"));
      };
    };
    reader.onerror = () => {
      reject(new Error("Erreur lors de la lecture du fichier"));
    };
  });
};
