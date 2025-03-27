
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
  onend: (event: any) => void;
  onnomatch: (event: any) => void;
  onaudiostart: (event: any) => void;
  onaudioend: (event: any) => void;
  onspeechstart: (event: any) => void;
  onspeechend: (event: any) => void;
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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
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
        
        setIsListening(true);
        
        // If we get a result, clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (event.results[resultIndex].isFinal) {
          // Apply the final transcript to the form
          form.setValue(fieldName, currentValue 
            ? `${currentValue} ${transcript}`
            : transcript
          );
        }
      };
      
      recognitionRef.current.onaudiostart = () => {
        console.log("Audio capturing started");
      };
      
      recognitionRef.current.onspeechstart = () => {
        console.log("Speech detection started");
        setIsListening(true);
      };
      
      recognitionRef.current.onspeechend = () => {
        console.log("Speech detection ended");
        // Set a timeout to show a notification if no speech is detected for a while
        if (isRecording) {
          timeoutRef.current = setTimeout(() => {
            toast.info("Aucune parole détectée. Continuez à parler ou arrêtez l'enregistrement.");
            setIsListening(false);
          }, 3000);
        }
      };
      
      recognitionRef.current.onend = () => {
        // If recording is still enabled, restart the recognition
        // This helps with continuous recording
        if (isRecording) {
          console.log("Recognition ended but still recording, restarting...");
          try {
            recognitionRef.current?.start();
          } catch (error) {
            console.error("Error restarting speech recognition:", error);
          }
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        
        // Clear any pending timeouts
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Only show error toast if we're actually recording (avoid showing errors when stopping)
        if (isRecording) {
          switch (event.error) {
            case 'no-speech':
              toast.info("Aucune parole détectée. Veuillez parler plus fort ou vérifier votre microphone.");
              break;
            case 'audio-capture':
              toast.error("Impossible d'accéder au microphone. Vérifiez que votre appareil a un microphone et que vous avez accordé les permissions.");
              setIsRecording(false);
              break;
            case 'not-allowed':
              toast.error("Permission de microphone refusée. Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.");
              setIsRecording(false);
              break;
            case 'network':
              toast.error("Problème de réseau. Vérifiez votre connexion internet.");
              break;
            default:
              toast.error("Erreur de reconnaissance vocale: " + event.error);
          }
        }
      };
    }
    
    return () => {
      // Clean up on unmount
      if (recognitionRef.current && isRecording) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Error stopping speech recognition on unmount:", error);
        }
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fieldName, form, isRecording]);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur");
      return;
    }
    
    if (isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        setIsListening(false);
        toast.success("Enregistrement vocal terminé");
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else {
      try {
        // Request microphone permission explicitly first
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            recognitionRef.current?.start();
            setIsRecording(true);
            toast.info("Enregistrement vocal démarré... Parlez clairement dans votre microphone.");
            
            // Set a timeout to check if speech is detected
            timeoutRef.current = setTimeout(() => {
              if (isRecording && !isListening) {
                toast.info("Aucune parole détectée. Assurez-vous que votre microphone fonctionne et parlez clairement.");
              }
            }, 3000);
          })
          .catch((error) => {
            console.error("Error getting microphone permission:", error);
            toast.error("Impossible d'accéder au microphone. Vérifiez vos paramètres de confidentialité.");
          });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Erreur lors du démarrage de la reconnaissance vocale.");
      }
    }
  };

  return {
    isRecording,
    isListening,
    toggleVoiceRecording,
    isSupported: !!window.SpeechRecognition || !!window.webkitSpeechRecognition
  };
};

export default useVoiceRecognition;
