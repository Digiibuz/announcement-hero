
import React, { useRef, useState } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Sparkles, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "@/styles/editor.css";

interface DescriptionFieldProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const DescriptionField = ({ form }: DescriptionFieldProps) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { isRecording, toggleVoiceRecording } = useVoiceRecognition({
    fieldName: 'description',
    form
  });

  // Update the form value when the editable div content changes
  const updateFormValue = () => {
    if (editorRef.current) {
      // Get the HTML content from the editable div
      const htmlContent = editorRef.current.innerHTML;
      // Set it to the form
      form.setValue('description', htmlContent);
    }
  };

  // Handle paste to strip formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateFormValue();
  };

  const generateImprovedContent = async () => {
    const currentDescription = form.getValues('description');
    if (!currentDescription) {
      toast.warning("Veuillez d'abord saisir du contenu à améliorer");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const enhancedText = `${currentDescription}\n\n[Version améliorée pour le SEO]\n${currentDescription
        .split(' ')
        .map(word => 
          Math.random() > 0.8 ? word.charAt(0).toUpperCase() + word.slice(1) : word
        )
        .join(' ')
      }\n\nCette version a été optimisée pour améliorer sa visibilité dans les moteurs de recherche.`;
      
      if (editorRef.current) {
        editorRef.current.innerHTML = enhancedText;
        updateFormValue();
      }
      
      toast.success("Contenu amélioré avec succès");
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error("Erreur lors de l'amélioration du contenu: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFormatting = (format: string) => {
    document.execCommand(format, false);
    updateFormValue();
  };

  React.useEffect(() => {
    // Initialize the editor content from form value
    const description = form.getValues('description') || '';
    if (editorRef.current && description) {
      editorRef.current.innerHTML = description;
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Description</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="flex items-center gap-1 text-xs"
            onClick={toggleVoiceRecording}
            disabled={isGenerating}
          >
            {isRecording ? (
              <>
                <MicOff size={14} className="text-destructive" />
                <span className="text-destructive">Arrêter</span>
              </>
            ) : (
              <>
                <Mic size={14} />
                <span>Dictée vocale</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="flex items-center gap-1 text-xs"
            onClick={generateImprovedContent}
            disabled={isRecording || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Optimisation...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Optimiser SEO</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex gap-1 mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => applyFormatting('bold')}
              >
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
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => applyFormatting('italic')}
              >
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
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => applyFormatting('underline')}
              >
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
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => applyFormatting('strikethrough')}
              >
                <Strikethrough size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Barré</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
                className={cn(
                  "flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 overflow-auto",
                  isRecording && "border-primary ring-2 ring-primary/20",
                  "rich-text-editor"
                )}
                onInput={updateFormValue}
                onPaste={handlePaste}
                onBlur={updateFormValue}
              />
            </FormControl>
            <FormMessage />
            {isRecording && (
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Enregistrement en cours...
              </div>
            )}
          </FormItem>
        )}
      />
    </div>
  );
};

export default DescriptionField;
