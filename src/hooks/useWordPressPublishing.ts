import { useState, useCallback } from 'react';
import { AnnouncementFormData } from '@/components/announcements/AnnouncementForm';
import { format } from 'date-fns';

interface WordPressPublishingHook {
  publishToWordPress: (data: AnnouncementFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const useWordPressPublishing = (): WordPressPublishingHook => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWordPressContent = (data: AnnouncementFormData): string => {
    const { title, description, images, additionalMedias, publishDate, status } = data;

    // Helper function to determine if a URL is a video
    const isVideoUrl = (url: string) => {
      return url.toLowerCase().includes('.mp4') ||
             url.toLowerCase().includes('.webm') ||
             url.toLowerCase().includes('.mov');
    };

    let content = `
<div style="font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 20px;">
  <h2 style="color: #2d3748; font-size: 32px; font-weight: bold; margin-bottom: 15px; border-bottom: 4px solid #4299e1; padding-bottom: 10px; display: inline-block;">${title}</h2>
  ${publishDate ? `<p style="font-size: 16px; color: #718096; margin-bottom: 10px;">Publié le: ${format(publishDate, 'PPP')}</p>` : ''}
  <div style="margin-top: 20px;">
`;

    // Image principale
    if (images && images.length > 0) {
      content += `
    <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
      <img src="${images[0]}" alt="${title}" style="width: 100%; height: auto; display: block; border-radius: 12px;">
    </div>
`;
    }

    // Contenu principal
    if (description) {
      content += `
    <div style="margin-top: 20px; font-size: 18px; color: #4a5568;">
      ${description}
    </div>
`;
    } else {
      content += `
    <p style="font-style: italic; color: #a0aec0;">Aucune description fournie.</p>
`;
    }

        // Ajouter les médias additionnels si présents
        if (additionalMedias && additionalMedias.length > 0) {
          content += `
<div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 15px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); text-align: center;">
  <h3 style="color: #2d3748; font-size: 24px; font-weight: 600; margin-bottom: 25px; text-align: center; border-bottom: 3px solid #4299e1; padding-bottom: 10px; display: inline-block;">Photos et vidéos</h3>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">`;

          additionalMedias.forEach((media) => {
            if (isVideoUrl(media)) {
              content += `
    <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); background: white; padding: 10px;">
      <video controls style="width: 100%; height: auto; border-radius: 8px;">
        <source src="${media}" type="video/mp4">
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </div>`;
            } else {
              content += `
    <div style="border-radius: 12px; overflow: hidden; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); background: white; padding: 10px;">
      <img src="${media}" alt="Photo supplémentaire" style="width: 100%; height: auto; border-radius: 8px; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
    </div>`;
            }
          });

          content += `
  </div>
</div>`;
        }

    content += `
  </div>
</div>
`;

    return content;
  };

  const publishToWordPress = useCallback(async (data: AnnouncementFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const wordpressContent = generateWordPressContent(data);

      // Simulate WordPress API call (replace with actual API endpoint)
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Contenu à publier sur WordPress:', wordpressContent);
      toast("L'annonce a été publiée avec succès sur WordPress !");
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication sur WordPress.');
      toast.error("Erreur lors de la publication sur WordPress.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { publishToWordPress, isLoading, error };
};

export default useWordPressPublishing;
