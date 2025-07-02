import React, { useRef, useState, useEffect } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link, Mic, MicOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useContentOptimization } from "@/hooks/useContentOptimization";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import SparklingStars from "@/components/ui/SparklingStars";
import AILoadingOverlay from "@/components/ui/AILoadingOverlay";
import AIGenerationOptions, { AIGenerationSettings } from "./AIGenerationOptions";
import MediaInsertion from "./MediaInsertion";
import ImageControls from "./ImageControls";
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
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiSettings, setAISettings] = useState<AIGenerationSettings>({
    tone: "convivial",
    length: "standard"
  });
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageControlsPosition, setImageControlsPosition] = useState({ x: 0, y: 0 });
  const [showImageControls, setShowImageControls] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { optimizeContent, isOptimizing } = useContentOptimization();
  const initialRenderRef = useRef(true);
  
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

  const generateNewContent = async () => {
    const currentTitle = form.getValues('title');
    const currentDescription = form.getValues('description') || "";
    
    if (!currentTitle) {
      toast.warning("Veuillez d'abord saisir un titre pour générer du contenu");
      return;
    }

    try {
      const generatedContent = await optimizeContent(
        "generateDescription", 
        currentTitle, 
        currentDescription,
        aiSettings
      );
      
      if (generatedContent && editorRef.current) {
        editorRef.current.innerHTML = generatedContent;
        updateFormValue();
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

  const handleInsertImage = (url: string, alt?: string) => {
    if (!editorRef.current) return;
    
    // Focus on the editor first
    editorRef.current.focus();
    
    // Create the image element with proper structure for text insertion
    const imageHtml = `
      <div class="image-container" style="margin: 15px 0;">
        <img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px; cursor: pointer; display: block;" class="editable-image" />
      </div>
      <p><br></p>
    `;
    
    // Get current selection or create one at the end
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Make sure the range is within our editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        // Insert the image at the current cursor position
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imageHtml;
        
        // Insert all child nodes from the temp div
        while (tempDiv.firstChild) {
          range.insertNode(tempDiv.firstChild);
        }
        
        // Move cursor to the paragraph after the image
        const allParagraphs = editorRef.current.querySelectorAll('p');
        const lastP = allParagraphs[allParagraphs.length - 1];
        if (lastP) {
          range.setStart(lastP, 0);
          range.setEnd(lastP, 0);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // If selection is not in editor, append to the end
        editorRef.current.innerHTML += imageHtml;
      }
    } else {
      // No selection, append to the end
      editorRef.current.innerHTML += imageHtml;
    }
    
    // Update form value
    updateFormValue();
    
    // Add click listeners to new images
    setTimeout(() => setupImageClickListeners(), 100);
  };

  const handleInsertVideo = (embedCode: string) => {
    // Pour WordPress, on insère simplement le lien YouTube
    // WordPress le convertira automatiquement en player intégré
    const videoHtml = `<p><a href="${embedCode}" target="_blank" rel="noopener noreferrer">${embedCode}</a></p><p><br></p>`;
    document.execCommand('insertHTML', false, videoHtml);
    updateFormValue();
  };

  const setupImageClickListeners = () => {
    if (!editorRef.current) return;
    
    // First, make sure all images have the editable-image class
    const allImages = editorRef.current.querySelectorAll('img');
    allImages.forEach((img) => {
      if (!img.classList.contains('editable-image')) {
        img.classList.add('editable-image');
        img.style.cursor = 'pointer';
      }
    });
    
    // Then add click listeners
    const editableImages = editorRef.current.querySelectorAll('img.editable-image');
    editableImages.forEach((img) => {
      const imageElement = img as HTMLImageElement;
      
      // Remove existing listeners to avoid duplicates
      imageElement.onclick = null;
      
      imageElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Image clicked!", imageElement.src);
        
        // Remove previous selection styling
        document.querySelectorAll('.image-selected').forEach(el => {
          el.classList.remove('image-selected');
        });
        
        // Add selection styling to current image
        imageElement.classList.add('image-selected');
        
        const rect = imageElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // Position controls to the right of the image
        setImageControlsPosition({
          x: rect.right + scrollLeft,
          y: rect.top + scrollTop + rect.height / 2
        });
        setSelectedImage(imageElement);
        setShowImageControls(true);
      });
    });
  };

  const handleImageResize = (size: 'small' | 'medium' | 'large' | 'full') => {
    if (!selectedImage) return;
    
    const sizeMap = {
      small: '25%',
      medium: '50%',
      large: '75%',
      full: '100%'
    };
    
    selectedImage.style.width = sizeMap[size];
    selectedImage.style.maxWidth = sizeMap[size];
    setShowImageControls(false);
    
    // Remove selection styling
    selectedImage.classList.remove('image-selected');
    
    updateFormValue();
  };

  const handleImageAlign = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImage) return;
    
    // Find or create image container
    let container = selectedImage.closest('.image-container') as HTMLElement;
    if (!container) {
      container = document.createElement('div');
      container.className = 'image-container';
      container.style.margin = '15px 0';
      selectedImage.parentNode?.insertBefore(container, selectedImage);
      container.appendChild(selectedImage);
    }
    
    const alignmentMap = {
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    };
    
    container.style.display = 'flex';
    container.style.justifyContent = alignmentMap[alignment];
    
    setShowImageControls(false);
    
    // Remove selection styling
    selectedImage.classList.remove('image-selected');
    
    updateFormValue();
  };

  const handleImageDelete = () => {
    if (!selectedImage) return;
    
    // Remove container if it exists, otherwise remove image directly
    const container = selectedImage.closest('.image-container');
    if (container) {
      container.remove();
    } else {
      selectedImage.remove();
    }
    
    setShowImageControls(false);
    setSelectedImage(null);
    updateFormValue();
  };

  // Close image controls when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showImageControls) {
        const target = e.target as Node;
        const isImageClick = target && (target as HTMLElement).tagName === 'IMG';
        const isControlsClick = document.querySelector('.image-controls')?.contains(target);
        
        if (!isImageClick && !isControlsClick && editorRef.current && !editorRef.current.contains(target)) {
          setShowImageControls(false);
          // Remove selection styling from all images
          document.querySelectorAll('.image-selected').forEach(el => {
            el.classList.remove('image-selected');
          });
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showImageControls]);

  useEffect(() => {
    const description = form.getValues('description') || '';
    if (editorRef.current && description && initialRenderRef.current) {
      editorRef.current.innerHTML = description;
      initialRenderRef.current = false;
      // Setup click listeners for existing images
      setTimeout(() => setupImageClickListeners(), 100);
    }
  }, [form]);

  useEffect(() => {
    const editorElement = editorRef.current;
    if (editorElement) {
      const handleInput = () => {
        debouncedUpdateFormValue();
        // Re-setup image listeners after content changes
        setTimeout(() => setupImageClickListeners(), 100);
      };
      
      editorElement.addEventListener('input', handleInput);
      editorElement.addEventListener('blur', updateFormValue);
      
      const observer = new MutationObserver(() => {
        debouncedUpdateFormValue();
        setTimeout(() => setupImageClickListeners(), 100);
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
          setTimeout(() => setupImageClickListeners(), 100);
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
      
      {/* Image Controls */}
      <ImageControls
        isOpen={showImageControls}
        onClose={() => setShowImageControls(false)}
        onResize={handleImageResize}
        onAlign={handleImageAlign}
        onDelete={handleImageDelete}
        position={imageControlsPosition}
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
              onClick={generateNewContent} 
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

          <Popover open={showAIOptions} onOpenChange={setShowAIOptions}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Settings size={16} />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Options de génération IA</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-[500px]" align="end">
              <div className="space-y-3">
                <h4 className="font-medium leading-none">Personnaliser la génération IA</h4>
                <p className="text-sm text-muted-foreground">
                  Ajustez le ton et la longueur du contenu généré selon vos besoins.
                </p>
                <AIGenerationOptions 
                  settings={aiSettings}
                  onSettingsChange={setAISettings}
                />
              </div>
            </PopoverContent>
          </Popover>
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

        {/* Nouveau bouton pour l'insertion de médias */}
        <MediaInsertion 
          onInsertImage={handleInsertImage}
          onInsertVideo={handleInsertVideo}
        />

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
                className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-auto rich-text-editor placeholder:text-muted-foreground/60" 
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
    </div>
  );
};

export default DescriptionField;
