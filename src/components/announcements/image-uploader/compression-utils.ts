
export const compressImage = async (file: File, isMobile: boolean): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          // Lower max dimensions for mobile to improve performance
          const MAX_WIDTH = isMobile ? 1200 : 1600;
          const MAX_HEIGHT = isMobile ? 1200 : 1600;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
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
          
          // Lower compression quality on mobile
          const compressionQuality = isMobile ? 0.65 : 0.7;
          
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
          }, 'image/webp', compressionQuality);
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
