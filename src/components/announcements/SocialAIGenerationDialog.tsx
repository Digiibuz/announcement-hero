import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2 } from "lucide-react";
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

  const content = (
    <>
      <div className="space-y-6 py-4">
        {/* Option pour reprendre le contenu de l'annonce */}
        <div className="flex items-center justify-between space-x-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex-1">
            <Label htmlFor="use-announcement" className="text-base font-medium">
              Reprendre le contenu de l'annonce
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              L'IA utilisera le titre et la description de votre annonce comme base pour générer le contenu {platformName}
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
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className={`h-5 w-5 text-${platformColor}-600`} />
              Générer du contenu pour {platformName}
            </DrawerTitle>
            <DrawerDescription>
              Configurez les options de génération pour adapter le contenu à votre publication {platformName}.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto flex-1 overscroll-contain">
            {content}
          </div>
          
          <DrawerFooter className="pt-2 flex-shrink-0">
            <Button 
              type="button" 
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`${
                platform === "facebook" 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              } text-white w-full`}
            >
              <Wand2 size={16} className="mr-2" />
              Générer le contenu
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Annuler
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
        
        {content}
        
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
