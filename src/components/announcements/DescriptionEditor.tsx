import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Mic, MicOff, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { useIsMobile } from "@/hooks/use-mobile";
import SparklingStars from "@/components/ui/SparklingStars";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import AIGenerationOptions, { AIGenerationSettings } from "./AIGenerationOptions";
import { Textarea } from "@/components/ui/textarea";
import "@/styles/editor.css";
import "@/styles/sparkles.css";

interface DescriptionEditorProps {
  form: UseFormReturn<AnnouncementFormData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DescriptionEditor = ({ form, open, onOpenChange }: DescriptionEditorProps) => {
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
  
  const { isRecording, isListening, toggleVoiceRecording, isSupported } = useVoiceRecognition({
    fieldName: "description",
    form
  });

  const updateFormValue = () => {
    if (editorRef.current) {
      let htmlContent = editorRef.current.innerHTML;
      form.setValue('description', htmlContent, { shouldDirty: true, shouldTouch: true });
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
    
    const currentInstructions = form.getValues('aiInstructions') || "";
    setTempAIInstructions(currentInstructions);
    setShowAIDialog(true);
  };

  const generateNewContent = async () => {
    const currentTitle = form.getValues('title');
    const currentDescription = form.getValues('description') || "";
    
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
        editorRef.current.innerHTML = generatedContent;
        form.setValue('description', generatedContent, { shouldDirty: true });
        form.setValue('aiInstructions', tempAIInstructions, { shouldDirty: true });
        toast.success("Description générée avec succès !");
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Une erreur s'est produite lors de la génération du contenu");
    }
  };

  const applyFormatting = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    debouncedUpdateFormValue();
  };

  const insertList = (ordered: boolean) => {
    document.execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList', false);
    editorRef.current?.focus();
    debouncedUpdateFormValue();
  };

  const insertLink = () => {
    if (linkUrl && linkText) {
      const selection = window.getSelection();
      if (selection) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        
        range.insertNode(link);
        
        range.setStartAfter(link);
        range.setEndAfter(link);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      setLinkUrl("");
      setLinkText("");
      setShowLinkPopover(false);
      editorRef.current?.focus();
      debouncedUpdateFormValue();
    }
  };

  useEffect(() => {
    if (open && editorRef.current && initialRenderRef.current) {
      const currentDescription = form.getValues('description') || '';
      if (currentDescription) {
        editorRef.current.innerHTML = currentDescription;
      }
      initialRenderRef.current = false;
    }
    
    const editor = editorRef.current;
    if (editor && open) {
      const handleInput = () => {
        debouncedUpdateFormValue();
      };
      
      editor.addEventListener('input', handleInput);
      return () => {
        editor.removeEventListener('input', handleInput);
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const subscription = form.watch((value, { name }) => {
        if (name === 'description' && editorRef.current) {
          const currentEditorContent = editorRef.current.innerHTML;
          const formValue = value.description || '';
          
          if (formValue !== currentEditorContent) {
            editorRef.current.innerHTML = formValue;
          }
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, open]);

  const EditorContent = () => (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-1 p-2">
          <TooltipProvider>
            {/* AI Generation Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openAIDialog}
                  onMouseEnter={() => setIsHoveringGenerate(true)}
                  onMouseLeave={() => setIsHoveringGenerate(false)}
                  className={cn(
                    "relative overflow-hidden transition-all duration-300 mr-2",
                    isHoveringGenerate && "bg-primary/10 border-primary/50 text-primary",
                    "group"
                  )}
                >
                  {isHoveringGenerate && !isOptimizing && (
                    <SparklingStars />
                  )}
                  <Sparkles className={cn(
                    "h-4 w-4 mr-2 transition-transform duration-300",
                    isHoveringGenerate && "scale-110"
                  )} />
                  Générer avec l'IA
                </Button>
              </TooltipTrigger>
              <TooltipContent>Générer du contenu avec l'IA</TooltipContent>
            </Tooltip>

            {/* Formatting Buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormatting('bold')}
                  className="h-8 w-8 p-0"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Gras</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormatting('italic')}
                  className="h-8 w-8 p-0"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italique</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormatting('underline')}
                  className="h-8 w-8 p-0"
                >
                  <Underline className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Souligné</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyFormatting('strikeThrough')}
                  className="h-8 w-8 p-0"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Barré</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertList(false)}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Liste à puces</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertList(true)}
                  className="h-8 w-8 p-0"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Liste numérotée</TooltipContent>
            </Tooltip>

            <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Insérer un lien</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Texte à afficher"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                    <input
                      type="url"
                      placeholder="https://exemple.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={insertLink}
                    disabled={!linkUrl || !linkText}
                    className="w-full"
                  >
                    Insérer
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {isSupported && (
              <>
                <div className="w-px h-6 bg-border mx-1" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "ghost"}
                      size="sm"
                      onClick={toggleVoiceRecording}
                      className={cn(
                        "h-8 w-8 p-0",
                        isRecording && "animate-pulse"
                      )}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Arrêter l'enregistrement" : "Dicter"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Voice Recording Hints */}
      {isRecording && (
        <div className="bg-primary/10 border-b border-primary/20 p-3">
          <div className="flex items-center gap-2 text-sm text-primary">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">
                {isListening ? "🎤 En écoute..." : "⏸️ En pause"}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Commandes vocales : "nouveau paragraphe", "point", "virgule", "gras", "italique"
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable={!isOptimizing}
          onPaste={handlePaste}
          className={cn(
            "prose prose-sm max-w-none p-4 focus:outline-none min-h-[400px]",
            "prose-headings:font-semibold prose-p:my-2",
            "prose-ul:my-2 prose-ol:my-2 prose-li:my-1",
            isOptimizing && "opacity-50 cursor-not-allowed"
          )}
          suppressContentEditableWarning
        />
      </div>

      {/* Footer with Done button */}
      <div className="border-t bg-background p-4">
        <Button 
          onClick={() => onOpenChange(false)}
          className="w-full"
          size="lg"
        >
          Terminé
        </Button>
      </div>

      {/* AI Loading Overlay */}
      <AILoadingOverlay isVisible={isOptimizing} />

      {/* AI Settings Dialog - Desktop */}
      {!isMobile ? (
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Configuration de la génération IA
              </DialogTitle>
              <DialogDescription>
                Personnalisez le ton et la longueur du contenu généré
              </DialogDescription>
            </DialogHeader>
            <AIGenerationOptions
              settings={aiSettings}
              onSettingsChange={setAISettings}
            />
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Instructions personnalisées (optionnel)</label>
              <Textarea
                placeholder="Ex: Mettre l'accent sur les promotions du week-end..."
                value={tempAIInstructions}
                onChange={(e) => setTempAIInstructions(e.target.value)}
                className="min-h-[100px]"
              />
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
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Générer le contenu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        /* AI Settings Dialog - Mobile */
        <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
          <DialogContent className="h-full max-w-full p-0 gap-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Configuration IA
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AIGenerationOptions
                settings={aiSettings}
                onSettingsChange={setAISettings}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Instructions personnalisées (optionnel)</label>
                <Textarea
                  placeholder="Ex: Mettre l'accent sur les promotions du week-end..."
                  value={tempAIInstructions}
                  onChange={(e) => setTempAIInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <div className="border-t p-4 space-y-2">
              <Button
                type="button"
                onClick={generateNewContent}
                className="w-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
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
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] flex flex-col">
          <DrawerHeader className="border-b flex items-center justify-between px-4 py-3">
            <DrawerTitle>Rédiger la description</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <EditorContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Rédiger la description</DialogTitle>
        </DialogHeader>
        <EditorContent />
      </DialogContent>
    </Dialog>
  );
};

export default DescriptionEditor;
