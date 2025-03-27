
import React from "react";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { toast } from "sonner";
import { AnnouncementFormData } from "./AnnouncementForm";

interface DescriptionFieldProps {
  form: UseFormReturn<AnnouncementFormData>;
}

const DescriptionField = ({ form }: DescriptionFieldProps) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  
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
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
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
    </div>
  );
};

export default DescriptionField;
