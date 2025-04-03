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

  // Process speech commands to handle punctuation
  const processCommand = (transcript: string, element: HTMLElement | null): string => {
    // Define command mappings for punctuation and formatting
    const commands: Record<string, (el: HTMLElement | null) => string | void> = {
      "point un": (el) => {
        if (el) {
          document.execCommand('insertText', false, '.');
          return '';
        } else {
          return '.';
        }
      },
      "point virgule un": (el) => {
        if (el) {
          document.execCommand('insertText', false, ';');
          return '';
        } else {
          return ';';
        }
      },
      "à la ligne": (el) => {
        if (el) {
          document.execCommand('insertText', false, '\n');
          return '';
        } else {
          return '\n';
        }
      }
    };

    // Convert transcript to lowercase for case-insensitive matching
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check for commands
    for (const [command, action] of Object.entries(commands)) {
      if (lowerTranscript === command) {
        const result = action(element);
        // We need to explicitly check if result is defined (not undefined)
        if (result !== undefined) {
          return result;
        }
        return ''; // Command processed, don't insert the command text
      }
    }
    
    // No command found, return original transcript
    return transcript;
  };

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const currentValue = form.getValues(fieldName) || '';
        const resultIndex = event.resultIndex;
        let transcript = event.results[resultIndex][0].transcript;
        
        setIsListening(true);
        
        // If we get a result, clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (event.results[resultIndex].isFinal) {
          console.log("Final transcript received:", transcript);
          
          // For contentEditable elements, handle differently
          if (fieldName === 'description') {
            const element = document.getElementById('description');
            if (element) {
              const processedText = processCommand(transcript, element);
              
              // If command returned empty, it was processed as a command
              if (processedText === '') {
                return;
              }
              
              let content = element.innerHTML;
              
              // Add space if there's already content
              if (content && !content.endsWith(' ') && !content.endsWith('>')) {
                content += ' ';
              }
              
              // Append the transcript
              element.innerHTML = content + processedText;
              
              // Manually trigger the form update
              const event = new Event('input', { bubbles: true });
              element.dispatchEvent(event);
              
              console.log("Updated editor content with speech:", element.innerHTML);
            } else {
              console.error("Description element not found");
            }
          } else {
            // For regular form fields
            const processedText = processCommand(transcript, null);
            form.setValue(
              fieldName, 
              currentValue ? `${currentValue} ${processedText}` : processedText,
              { shouldValidate: true, shouldDirty: true }
            );
            console.log("Updated form value:", form.getValues(fieldName));
          }
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
            toast.info("Commandes disponibles: 'point un' → ., 'point virgule un' → ;, 'à la ligne' → saut de ligne");
            
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
