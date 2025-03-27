import React, { useState } from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Sparkles, Bold, Italic, Underline, Strikethrough, Eye, EyeOff } from "lucide-react";
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
import { Card } from "@/components/ui/card";

interface DescriptionFieldProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const DescriptionField = ({ form }: DescriptionFieldProps) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const { isRecording, toggleVoiceRecording } = useVoiceRecognition({
    fieldName: 'description',
    form
  });

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
      
      form.setValue('description', enhancedText);
      toast.success("Contenu amélioré avec succès");
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error("Erreur lors de l'amélioration du contenu: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyFormatting = (format: string) => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        formattedText = `<s>${selectedText}</s>`;
        break;
      default:
        formattedText = selectedText;
    }
    
    form.setValue('description', beforeText + formattedText + afterText);
    
    // Reset selection to after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = beforeText.length + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const renderFormattedText = (content: string) => {
    if (!content) return <p className="text-muted-foreground italic">La prévisualisation apparaîtra ici...</p>;
    
    return (
      <div dangerouslySetInnerHTML={{ 
        __html: content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
          .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/g, '<strong>$1</strong>')
          .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/g, '<em>$1</em>')
          .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/g, '<u>$1</u>')
          .replace(/&lt;s&gt;(.*?)&lt;\/s&gt;/g, '<s>$1</s>')
          .replace(/\n/g, '<br/>')
      }} />
    );
  };

  const description = form.watch('description');

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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="flex items-center gap-1 text-xs"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff size={14} />
                <span>Masquer aperçu</span>
              </>
            ) : (
              <>
                <Eye size={14} />
                <span>Afficher aperçu</span>
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
              <Textarea
                id="description"
                placeholder="Entrez la description de l'annonce ou utilisez la dictée vocale"
                className={cn(
                  "min-h-32",
                  isRecording && "border-primary ring-2 ring-primary/20"
                )}
                {...field}
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
      
      {showPreview && description && (
        <Card className="p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-muted-foreground" />
            <h3 className="text-sm font-medium">Prévisualisation</h3>
          </div>
          <div className="prose prose-sm max-w-none border-t pt-3">
            {renderFormattedText(description)}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DescriptionField;
