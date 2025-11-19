import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Mic, MicOff, Sparkles, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import SparklingStars from "@/components/ui/SparklingStars";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import AIGenerationOptions, { AIGenerationSettings } from "./AIGenerationOptions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import "@/styles/editor.css";
import "@/styles/sparkles.css";

interface DescriptionMobileEditorProps {
  form: UseFormReturn<AnnouncementFormData>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DescriptionMobileEditor = ({ form, open, onOpenChange }: DescriptionMobileEditorProps) => {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isHoveringGenerate, setIsHoveringGenerate] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiSettings, setAISettings] = useState<AIGenerationSettings>({
    tone: "convivial",
    length: "standard"
  });
  const [aiInstructions, setAiInstructions] = useState("");
  const [tempContent, setTempContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const { optimizeContent, isOptimizing } = useContentOptimization();

  const { isRecording, isListening, toggleVoiceRecording, isSupported } = useVoiceRecognition({
    fieldName: "description",
    form
  });

  // Initialize content when drawer opens - only once per opening
  useEffect(() => {
    console.log('🔍 DescriptionMobileEditor useEffect - open:', open);
    
    if (open && editorRef.current) {
      const currentContent = form.getValues('description') || '';
      console.log('📝 Loading description from form:', currentContent ? currentContent.substring(0, 50) + '...' : 'VIDE');
      console.log('📝 Full content length:', currentContent.length);
      
      editorRef.current.innerHTML = currentContent;
      setTempContent(currentContent);
      initializedRef.current = true;
    } else if (!open) {
      console.log('🚪 Drawer closing, resetting initialization flag');
      // Reset initialization flag when drawer closes
      initializedRef.current = false;
    }
  }, [open]); // Ne dépend QUE de 'open', pas de 'form'

  const updateTempContent = () => {
    if (editorRef.current) {
      const htmlContent = editorRef.current.innerHTML;
      setTempContent(htmlContent);
    }
  };

  const handleValidate = () => {
    // Récupérer le contenu à jour directement depuis l'éditeur
    const finalContent = editorRef.current?.innerHTML || '';
    console.log('✅ handleValidate - Saving description:', finalContent ? finalContent.substring(0, 50) + '...' : 'VIDE');
    console.log('✅ Full content length:', finalContent.length);
    
    form.setValue('description', finalContent, { shouldDirty: true, shouldTouch: true });
    
    // Vérifier que c'est bien sauvegardé
    const savedContent = form.getValues('description');
    console.log('✅ Verification - Content after save:', savedContent ? savedContent.substring(0, 50) + '...' : 'VIDE');
    
    onOpenChange(false);
    toast.success("Description enregistrée");
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateTempContent();
  };

  const openAIDialog = () => {
    const currentTitle = form.getValues('title');
    
    if (!currentTitle) {
      toast.warning("Veuillez d'abord saisir un titre pour générer du contenu");
      return;
    }
    
    setShowAIDialog(true);
  };

  const generateNewContent = async () => {
    const currentTitle = form.getValues('title');
    
    setShowAIDialog(false);

    try {
      const generatedContent = await optimizeContent(
        "generateDescription", 
        currentTitle, 
        tempContent,
        aiSettings,
        aiInstructions
      );
      
      if (generatedContent && editorRef.current) {
        editorRef.current.innerHTML = generatedContent;
        setTempContent(generatedContent);
      }
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error(error?.message || "Erreur lors de la génération");
    }
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateTempContent();
  };

  const insertList = (ordered: boolean) => {
    const command = ordered ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(command, false);
    editorRef.current?.focus();
    updateTempContent();
  };

  const insertLink = () => {
    if (!linkUrl) {
      toast.error("Veuillez saisir une URL");
      return;
    }
    
    const selection = window.getSelection();
    const text = linkText || linkUrl;
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = text;
      link.className = "text-primary underline";
      
      range.insertNode(link);
      range.collapse(false);
    }
    
    setShowLinkPopover(false);
    setLinkUrl("");
    setLinkText("");
    editorRef.current?.focus();
    updateTempContent();
  };

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[100dvh] rounded-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-bold">Description</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleValidate}
                className="text-primary hover:text-primary/80"
              >
                <Check className="h-5 w-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-2 border-b bg-muted/30 overflow-x-auto">
              <TooltipProvider>
                {/* AI Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={openAIDialog}
                      disabled={isOptimizing.generateDescription}
                      onMouseEnter={() => setIsHoveringGenerate(true)}
                      onMouseLeave={() => setIsHoveringGenerate(false)}
                      className={cn(
                        "relative h-9 w-9 p-0 transition-all duration-300",
                        isHoveringGenerate && "scale-105"
                      )}
                    >
                      {isOptimizing.generateDescription ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {isHoveringGenerate && <SparklingStars />}
                          <Wand2 className={cn(
                            "h-4 w-4 transition-colors duration-300",
                            isHoveringGenerate && "text-primary"
                          )} />
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Générer avec l'IA</TooltipContent>
                </Tooltip>

                {/* Formatting buttons */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFormatting('bold')}
                      className="h-9 w-9 p-0"
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
                      className="h-9 w-9 p-0"
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
                      className="h-9 w-9 p-0"
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
                      className="h-9 w-9 p-0"
                    >
                      <Strikethrough className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Barré</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertList(false)}
                      className="h-9 w-9 p-0"
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
                      className="h-9 w-9 p-0"
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
                      className="h-9 w-9 p-0"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">URL</label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 mt-1 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Texte (optionnel)</label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Texte du lien"
                          className="w-full px-3 py-2 mt-1 border rounded-md"
                        />
                      </div>
                      <Button onClick={insertLink} className="w-full">
                        Insérer le lien
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Voice button */}
                {isSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={isRecording ? "default" : "ghost"}
                        size="sm"
                        onClick={toggleVoiceRecording}
                        className={cn(
                          "h-9 w-9 p-0",
                          isRecording && "bg-destructive hover:bg-destructive/90"
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
                      {isRecording ? "Arrêter" : "Dicter"}
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-4">
              <div
                ref={editorRef}
                contentEditable
                onInput={updateTempContent}
                onPaste={handlePaste}
                className="min-h-[400px] outline-none prose prose-sm max-w-none focus:outline-none"
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              />
            </div>

            {/* Character counter */}
            <div className="px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground text-right">
              {tempContent.replace(/<[^>]*>/g, '').length} caractères
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* AI Loading Overlay */}
      <AILoadingOverlay isVisible={isOptimizing.generateDescription} />

      {/* AI Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Générer avec l'IA
            </DialogTitle>
            <DialogDescription>
              Personnalisez la génération de votre description
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <AIGenerationOptions 
              settings={aiSettings}
              onSettingsChange={setAISettings}
            />
            
            <div className="space-y-2">
              <Label htmlFor="ai-instructions">Instructions personnalisées (optionnel)</Label>
              <Textarea
                id="ai-instructions"
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Ex: Insister sur l'aspect écologique, mentionner les garanties..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Annuler
            </Button>
            <Button onClick={generateNewContent} disabled={isOptimizing.generateDescription}>
              {isOptimizing.generateDescription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Générer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DescriptionMobileEditor;
