
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

// Define the SpeechRecognition types to fix TypeScript errors
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceRecognitionProps {
  fieldName: string;
  form: UseFormReturn<any>;
}

const useVoiceRecognition = ({ fieldName, form }: UseVoiceRecognitionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const currentValue = form.getValues(fieldName);
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        
        if (event.results[resultIndex].isFinal) {
          form.setValue(fieldName, currentValue 
            ? `${currentValue} ${transcript}`
            : transcript
          );
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        toast.error("Erreur de reconnaissance vocale: " + event.error);
      };
    }
    
    return () => {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    };
  }, [fieldName, form]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.success("Enregistrement vocal terminé");
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info("Enregistrement vocal démarré...");
    }
  };

  return {
    isRecording,
    toggleVoiceRecording,
    isSupported: !!window.SpeechRecognition || !!window.webkitSpeechRecognition
  };
};

export default useVoiceRecognition;
