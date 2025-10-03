import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";

interface SocialAIGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (useAnnouncementContent: boolean, customInstructions: string) => void;
  platform: "facebook" | "instagram";
  isGenerating?: boolean;
}

const SocialAIGenerationDialog = ({
  open,
  onOpenChange,
  onGenerate,
  platform,
  isGenerating = false
}: SocialAIGenerationDialogProps) => {
  const isMobile = useIsMobile();
  const [useAnnouncementContent, setUseAnnouncementContent] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");

  const handleGenerate = () => {
    onGenerate(useAnnouncementContent, customInstructions);
    onOpenChange(false);
  };

  const platformName = platform === "facebook" ? "Facebook" : "Instagram";
  const platformColor = platform === "facebook" ? "blue" : "purple";

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="h-screen max-h-screen w-screen max-w-full m-0 p-0 rounded-none border-0 translate-x-0 translate-y-0 top-0 left-0 right-0 bottom-0 flex flex-col [&>button]:hidden"
          style={{ animation: 'none' }}
        >
          {/* Header fixe */}
          <div className="flex-shrink-0 border-b bg-background">
            <div className="flex items-center gap-3 p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className={`h-4 w-4 text-${platformColor}-600`} />
                  Générer pour {platformName}
                </h2>
              </div>
            </div>
          </div>
          
          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
            {/* Option pour reprendre le contenu de l'annonce */}
            <div className="flex items-center justify-between space-x-2 p-4 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <Label htmlFor="use-announcement" className="text-base font-medium">
                  Reprendre le contenu de l'annonce
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  L'IA utilisera le titre et la description de votre annonce comme base
                </p>
              </div>
              <Switch
                id="use-announcement"
                checked={useAnnouncementContent}
                onCheckedChange={setUseAnnouncementContent}
              />
            </div>

            {/* Instructions personnalisées */}
            <div className="space-y-2">
              <Label htmlFor="custom-instructions" className="flex items-center gap-2">
                <Sparkles className={`h-4 w-4 text-${platformColor}-600`} />
                Instructions spécifiques (optionnel)
              </Label>
              <Textarea 
                id="custom-instructions"
                placeholder="Donnez des instructions à l'IA pour personnaliser le contenu..."
                className="min-h-[120px] resize-none"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
            </div>

            {/* Bouton de génération */}
            <Button 
              type="button" 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`${
                platform === "facebook" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              } text-white w-full h-12 text-base font-medium shadow-lg`}
            >
              <Wand2 size={18} className="mr-2" />
              Générer le contenu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 text-${platformColor}-600`} />
            Générer du contenu pour {platformName}
          </DialogTitle>
          <DialogDescription>
            Configurez les options de génération pour adapter le contenu à votre publication {platformName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Option pour reprendre le contenu de l'annonce */}
          <div className="flex items-center justify-between space-x-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="use-announcement-desktop" className="text-base font-medium">
                Reprendre le contenu de l'annonce
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                L'IA utilisera le titre et la description de votre annonce comme base pour générer le contenu {platformName}
              </p>
            </div>
            <Switch
              id="use-announcement-desktop"
              checked={useAnnouncementContent}
              onCheckedChange={setUseAnnouncementContent}
            />
          </div>

          {/* Instructions personnalisées */}
          <div className="space-y-2">
            <Label htmlFor="custom-instructions-desktop" className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 text-${platformColor}-600`} />
              Instructions spécifiques (optionnel)
            </Label>
            <Textarea 
              id="custom-instructions-desktop"
              placeholder="Donnez des instructions à l'IA pour personnaliser le contenu..."
              className="min-h-[120px] resize-none"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`${
              platform === "facebook" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            } text-white`}
          >
            <Wand2 size={16} className="mr-2" />
            Générer le contenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SocialAIGenerationDialog;
