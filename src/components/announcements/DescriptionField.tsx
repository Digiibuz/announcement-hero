import { useRef, useState, useEffect } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Mic, MicOff, Sparkles, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { useIsMobile } from "@/hooks/use-mobile";
import SparklingStars from "@/components/ui/SparklingStars";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import AIGenerationOptions, { AIGenerationSettings } from "./AIGenerationOptions";
import { Textarea } from "@/components/ui/textarea";
import "@/styles/editor.css";
import "@/styles/sparkles.css";

interface DescriptionFieldProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const DescriptionField = ({
  form
}: DescriptionFieldProps) => {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isHoveringGenerate, setIsHoveringGenerate] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiSettings, setAISettings] = useState<AIGenerationSettings>({
    tone: "convivial",
    length: "standard"
  });
  const [tempAIInstructions, setTempAIInstructions] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const initialRenderRef = useRef(true);
  const isMobile = useIsMobile();
  
  // Add voice recognition integration
  const { isRecording, isListening, toggleVoiceRecording, isSupported } = useVoiceRecognition({
    fieldName: "description",
    form
  });

  const updateFormValue = () => {
    if (editorRef.current) {
      let htmlContent = editorRef.current.innerHTML;
      form.setValue('description', htmlContent, { shouldDirty: true, shouldTouch: true });
      console.log("Form value updated from editor:", htmlContent);
    }
  };

  const debouncedUpdateFormValue = () => {
    if (editorRef.current) {
      setTimeout(() => {
        updateFormValue();
      }, 100);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateFormValue();
  };

  const openAIDialog = () => {
    const currentTitle = form.getValues('title');
    
    if (!currentTitle) {
      toast.warning("Veuillez d'abord saisir un titre pour générer du contenu");
      return;
    }
    
    // Charger les instructions actuelles depuis le formulaire
    const currentInstructions = form.getValues('aiInstructions') || "";
    setTempAIInstructions(currentInstructions);
    setShowAIDialog(true);
  };

  const generateNewContent = async () => {
    const currentTitle = form.getValues('title');
    const currentDescription = form.getValues('description') || "";
    
    // Fermer la modale
    setShowAIDialog(false);

    try {
      const generatedContent = await optimizeContent(
        "generateDescription", 
        currentTitle, 
        currentDescription,
        aiSettings,
        tempAIInstructions
      );
      
      if (generatedContent && editorRef.current) {
        console.log("Generated content (HTML):", generatedContent);
        
        // Insérer le contenu HTML optimisé SEO directement
        editorRef.current.innerHTML = generatedContent;
        updateFormValue();
        
        // Sauvegarder les instructions dans le formulaire
        form.setValue('aiInstructions', tempAIInstructions);
      }
    } catch (error: any) {
      console.error("Error generating content:", error);
    }
  };

  const applyFormatting = (format: string) => {
    document.execCommand(format, false);
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      updateFormValue();
    }
  };

  const insertList = (type: 'insertUnorderedList' | 'insertOrderedList') => {
    document.execCommand(type, false);
    updateFormValue();
  };

  const insertLink = () => {
    if (!linkUrl) {
      toast.warning("Veuillez entrer une URL");
      return;
    }
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    const text = linkText || url;
    const link = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    document.execCommand('insertHTML', false, link);
    setLinkUrl("");
    setLinkText("");
    setShowLinkPopover(false);
    updateFormValue();
  };


  useEffect(() => {
    const description = form.getValues('description') || '';
    if (editorRef.current && description && initialRenderRef.current) {
      editorRef.current.innerHTML = description;
      initialRenderRef.current = false;
    }
  }, [form]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement) {
      const handleInput = () => {
        debouncedUpdateFormValue();
      };
      
      editorElement.addEventListener('input', handleInput);
      editorElement.addEventListener('blur', updateFormValue);
      
      const observer = new MutationObserver(() => {
        debouncedUpdateFormValue();
      });
      
      observer.observe(editorElement, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
      
      return () => {
        editorElement.removeEventListener('input', handleInput);
        editorElement.removeEventListener('blur', updateFormValue);
        observer.disconnect();
      };
    }
  }, []);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'description' && editorRef.current) {
        const currentDescription = form.getValues('description');
        if (currentDescription && editorRef.current.innerHTML !== currentDescription) {
          editorRef.current.innerHTML = currentDescription;
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className="space-y-2">
      {/* AI Loading Overlay */}
      <AILoadingOverlay 
        isVisible={isOptimizing.generateDescription} 
      />
      
      <div className="flex justify-between items-center">
        <Label>Description</Label>
        
        <div className="flex gap-2">
          <div 
            className="relative sparkle-container"
            onMouseEnter={() => setIsHoveringGenerate(true)}
            onMouseLeave={() => setIsHoveringGenerate(false)}
          >
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              className="flex items-center gap-1 relative overflow-hidden transition-all duration-300 bg-white text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600" 
              onClick={openAIDialog} 
              disabled={isOptimizing.generateDescription}
            >
              <SparklingStars isVisible={isHoveringGenerate && !isOptimizing.generateDescription} />
              {isOptimizing.generateDescription ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Générer avec l'IA</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1 mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => applyFormatting('bold')}>
                <Bold size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gras</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => applyFormatting('italic')}>
                <Italic size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italique</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => applyFormatting('underline')}>
                <Underline size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Souligné</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => applyFormatting('strikethrough')}>
                <Strikethrough size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Barré</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => insertList('insertUnorderedList')}>
                <List size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Liste à puces</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => insertList('insertOrderedList')}>
                <ListOrdered size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Liste numérotée</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                    <Link size={16} />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajouter un lien</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Ajouter un lien</h4>
                <p className="text-sm text-muted-foreground">
                  Insérez une URL et optionnellement un texte pour le lien.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="url" className="text-right col-span-1">
                    URL
                  </Label>
                  <input 
                    id="url" 
                    placeholder="https://example.com" 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    value={linkUrl} 
                    onChange={e => setLinkUrl(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="text" className="text-right col-span-1">
                    Texte
                  </Label>
                  <input 
                    id="text" 
                    placeholder="Texte du lien (optionnel)" 
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                    value={linkText} 
                    onChange={e => setLinkText(e.target.value)} 
                  />
                </div>
                <Button type="button" onClick={insertLink} className="mt-2">
                  Insérer le lien
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>


        {/* Voice Recording Button */}
        {isSupported && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant={isRecording ? "destructive" : "outline"} 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 ml-1", 
                    isRecording && isListening ? "animate-pulse" : ""
                  )}
                  onClick={toggleVoiceRecording}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? "Arrêter la dictée vocale" : "Démarrer la dictée vocale"}</p>
                {isRecording && <p className="text-xs mt-1">Vous pouvez dicter la ponctuation et dire "à la ligne"</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <FormField 
        control={form.control} 
        name="description" 
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <div 
                ref={editorRef} 
                id="description" 
                contentEditable 
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-auto rich-text-editor placeholder:text-muted-foreground/60" 
                onInput={updateFormValue} 
                onPaste={handlePaste} 
                onBlur={updateFormValue}
                data-placeholder="Rédigez votre description ici..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} 
      />


      {/* Add a hint for voice dictation with punctuation commands */}
      {isRecording && (
        <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded-md">
          <p className="font-medium mb-1">Commandes vocales disponibles :</p>
          <ul className="list-disc pl-4 grid grid-cols-2 gap-x-4 gap-y-1">
            <li>"point" → .</li>
            <li>"virgule" → ,</li>
            <li>"point d'exclamation" → !</li>
            <li>"point d'interrogation" → ?</li>
            <li>"point-virgule" → ;</li>
            <li>"deux points" → :</li>
            <li>"à la ligne" → nouvelle ligne</li>
            <li>"nouveau paragraphe" → double saut</li>
          </ul>
        </div>
      )}

      {/* Dialog de configuration IA - Plein écran sur mobile, Dialog normal sur desktop */}
      {isMobile ? (
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent 
            className="h-screen max-h-screen w-screen max-w-full m-0 p-0 rounded-none border-0 translate-x-0 translate-y-0 top-0 left-0 right-0 bottom-0 flex flex-col"
            style={{ animation: 'none' }}
          >
            {/* Header fixe */}
            <div className="flex-shrink-0 border-b bg-background">
              <div className="flex items-center gap-3 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAIDialog(false)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Configuration IA
                  </h2>
                </div>
              </div>
            </div>
            
            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Options de ton et longueur */}
              <AIGenerationOptions 
                settings={aiSettings}
                onSettingsChange={setAISettings}
              />
              
              {/* Instructions spécifiques */}
              <div className="space-y-2">
                <Label htmlFor="ai-instructions-mobile" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Instructions spécifiques (optionnel)
                </Label>
                <Textarea 
                  id="ai-instructions-mobile"
                  placeholder="Donnez des instructions à l'IA pour personnaliser le contenu..."
                  className="min-h-[120px] resize-none"
                  value={tempAIInstructions}
                  onChange={(e) => setTempAIInstructions(e.target.value)}
                />
              </div>
            </div>
            
            {/* Footer fixe avec padding bottom pour safe area */}
            <div className="flex-shrink-0 border-t bg-background p-4 pb-8 space-y-2">
              <Button 
                type="button" 
                onClick={generateNewContent}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              >
                <Wand2 size={16} className="mr-2" />
                Générer le contenu
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAIDialog(false)}
                className="w-full"
              >
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Configuration de la génération IA
              </DialogTitle>
              <DialogDescription>
                Personnalisez le ton, la longueur et ajoutez des instructions spécifiques pour adapter le contenu généré à vos besoins.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Options de ton et longueur */}
              <AIGenerationOptions 
                settings={aiSettings}
                onSettingsChange={setAISettings}
              />
              
              {/* Instructions spécifiques */}
              <div className="space-y-2">
                <Label htmlFor="ai-instructions-desktop" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Instructions spécifiques (optionnel)
                </Label>
                <Textarea 
                  id="ai-instructions-desktop"
                  placeholder="Donnez des instructions à l'IA pour personnaliser le contenu..."
                  className="min-h-[120px] resize-none"
                  value={tempAIInstructions}
                  onChange={(e) => setTempAIInstructions(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAIDialog(false)}
              >
                Annuler
              </Button>
              <Button 
                type="button" 
                onClick={generateNewContent}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Wand2 size={16} className="mr-2" />
                Générer le contenu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DescriptionField;
