
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, Video, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MediaInsertionProps {
  onInsertImage: (url: string, alt?: string) => void;
  onInsertVideo: (embedCode: string) => void;
}

const MediaInsertion = ({ onInsertImage, onInsertVideo }: MediaInsertionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image valide");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("La taille de l'image ne doit pas dépasser 10 MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('Images')
        .getPublicUrl(fileName);

      onInsertImage(publicUrl, file.name.split('.')[0]);
      setIsOpen(false);
      toast.success("Image ajoutée avec succès");
      
      // Reset the input
      event.target.value = '';
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Erreur lors de l'upload de l'image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUrlInsert = () => {
    if (!imageUrl) {
      toast.error("Veuillez saisir une URL d'image");
      return;
    }

    onInsertImage(imageUrl, imageAlt);
    setImageUrl("");
    setImageAlt("");
    setIsOpen(false);
    toast.success("Image ajoutée avec succès");
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleVideoInsert = () => {
    if (!videoUrl) {
      toast.error("Veuillez saisir une URL de vidéo");
      return;
    }

    const youtubeId = getYouTubeVideoId(videoUrl);
    if (youtubeId) {
      // Pour WordPress, on utilise un shortcode ou un lien simple que WordPress convertira automatiquement
      const embedCode = `https://www.youtube.com/watch?v=${youtubeId}`;
      onInsertVideo(embedCode);
      setVideoUrl("");
      setIsOpen(false);
      toast.success("Vidéo YouTube ajoutée avec succès");
    } else {
      toast.error("URL YouTube non valide. Veuillez utiliser un lien YouTube valide.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
          <ImageIcon size={16} />
          <span>Média</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un média</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Image
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video size={16} />
              Vidéo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="space-y-4">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload size={14} />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link size={14} />
                  URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-3">
                <div>
                  <Label htmlFor="image-upload">Sélectionner une image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats supportés: JPEG, PNG, WebP, GIF (max 10 MB)
                  </p>
                  {isUploading && (
                    <p className="text-sm text-blue-600 mt-2">Upload en cours...</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-3">
                <div>
                  <Label htmlFor="image-url">URL de l'image</Label>
                  <Input
                    id="image-url"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="image-alt">Texte alternatif (optionnel)</Label>
                  <Input
                    id="image-alt"
                    placeholder="Description de l'image"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                  />
                </div>
                <Button onClick={handleImageUrlInsert} className="w-full">
                  Ajouter l'image
                </Button>
              </TabsContent>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="video" className="space-y-4">
            <div>
              <Label htmlFor="video-url">URL YouTube</Label>
              <Input
                id="video-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Collez le lien de la vidéo YouTube que vous souhaitez intégrer
              </p>
            </div>
            <Button onClick={handleVideoInsert} className="w-full">
              Ajouter la vidéo
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MediaInsertion;
