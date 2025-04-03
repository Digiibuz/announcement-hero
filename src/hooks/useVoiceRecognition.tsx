
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

// Interface for punctuation and formatting commands
interface CommandMapping {
  [key: string]: string | (() => void);
}

const useVoiceRecognition = ({ fieldName, form }: UseVoiceRecognitionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const capitalizeNextRef = useRef<boolean>(true);

  // Define punctuation and formatting commands
  const punctuationCommands: CommandMapping = {
    // Punctuation
    "virgule": ", ",
    "point": ". ",
    "point d'exclamation": "! ",
    "exclamation": "! ",
    "point d'interrogation": "? ",
    "interrogation": "? ",
    "point-virgule": "; ",
    "point virgule": "; ",
    "deux points": ": ",
    "ouvrez les guillemets": " « ",
    "fermez les guillemets": " » ",
    "ouvrir parenthèse": " (",
    "fermer parenthèse": ") ",
    "ouvrir les parenthèses": " (",
    "fermer les parenthèses": ") ",
    "tiret": " - ",
    "pourcentage": " % ",
    "euro": " € ",
    "dollar": " $ ",
    
    // Line breaks and formatting
    "à la ligne": () => insertLineBreak(),
    "nouvelle ligne": () => insertLineBreak(),
    "aller à la ligne": () => insertLineBreak(),
    "nouveau paragraphe": () => insertLineBreak(true),
  };

  // Function to insert a line break
  const insertLineBreak = (doubleBreak = false) => {
    console.log("Inserting line break, doubleBreak:", doubleBreak);
    if (fieldName === 'description') {
      const element = document.getElementById('description');
      if (element) {
        try {
          // Focus the element to ensure it's active
          element.focus();
          
          // Create and dispatch a custom event for the line break before inserting
          const customEvent = new CustomEvent('linebreak', { bubbles: true, detail: { doubleBreak } });
          element.dispatchEvent(customEvent);
          
          // Insert HTML content with proper BR tags
          const html = doubleBreak ? '<br><br>' : '<br>';
          document.execCommand('insertHTML', false, html);
          
          // Use a modern approach instead of MutationEvent (which is deprecated)
          // Trigger change events to ensure React form integration works
          setTimeout(() => {
            // Trigger input event
            const inputEvent = new InputEvent('input', { bubbles: true, cancelable: true });
            element.dispatchEvent(inputEvent);
            
            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            element.dispatchEvent(changeEvent);
          }, 10);
          
          // Ensure cursor is placed at the end
          const selection = window.getSelection();
          if (selection) {
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false); // Collapse to end
            selection.removeAllRanges();
            selection.addRange(range);
          }

          // Set a timeout to update the form value after DOM updates
          setTimeout(() => {
            // Get the current innerHTML with line breaks
            const updatedContent = element.innerHTML;
            console.log("Current element HTML before form update:", updatedContent);
            
            // Explicitly set the form value with the updated HTML content
            form.setValue(
              fieldName, 
              updatedContent,
              { shouldValidate: true, shouldDirty: true }
            );
            console.log("Form updated with line break, new content:", updatedContent);
          }, 50);

          // Next word should be capitalized after a line break
          capitalizeNextRef.current = true;
          
          console.log("Line break inserted, editor content:", element.innerHTML);
        } catch (error) {
          console.error("Error inserting line break:", error);
          toast.error("Erreur lors de l'insertion d'un saut de ligne");
        }
      } else {
        console.error("Description element not found");
      }
    } else {
      // For regular form fields, just add a newline character
      const currentValue = form.getValues(fieldName) || '';
      form.setValue(
        fieldName, 
        currentValue + (doubleBreak ? '\n\n' : '\n'),
        { shouldValidate: true, shouldDirty: true }
      );
      // Next word should be capitalized after a line break
      capitalizeNextRef.current = true;
    }
  };

  // Process the transcript for commands
  const processTranscript = (transcript: string): string => {
    // Clean and lowercase for processing
    const cleanTranscript = transcript.trim().toLowerCase();
    
    // Check if this is a command
    for (const [command, action] of Object.entries(punctuationCommands)) {
      if (cleanTranscript === command) {
        console.log(`Detected command: "${command}"`);
        
        // If action is a function, execute it and return empty string
        if (typeof action === 'function') {
          action();
          return '';
        }
        
        // For punctuation marks that end sentences, set capitalize flag
        if (action === '. ' || action === '! ' || action === '? ') {
          capitalizeNextRef.current = true;
        }
        
        // Return the punctuation mark
        return action as string;
      }
    }
    
    // No command found, process as regular text
    let processedText = transcript;

    // Capitalize first word if needed
    if (capitalizeNextRef.current && processedText.length > 0) {
      processedText = processedText.charAt(0).toUpperCase() + processedText.slice(1);
      capitalizeNextRef.current = false;
    }
    
    return processedText;
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
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        
        setIsListening(true);
        
        // If we get a result, clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        if (event.results[resultIndex].isFinal) {
          console.log("Final transcript received:", transcript);
          
          // Get only the new part of the transcript
          const newWords = transcript.trim();
          
          // Process for commands and formatting
          const processedText = processTranscript(newWords);
          
          // Skip if it's an empty string (happens when a function command is executed)
          if (processedText === '') {
            console.log("Empty processed text, skipping form update");
            return;
          }
          
          // For contentEditable elements, handle differently
          if (fieldName === 'description') {
            const element = document.getElementById('description');
            if (element) {
              // Add space before if not starting with punctuation and not at beginning
              let textToInsert = processedText;
              const processedIsJustPunctuation = /^\s*[,.!?:;"'\-\(\)]+\s*$/.test(processedText);
              
              if (!processedIsJustPunctuation && element.innerHTML && !element.innerHTML.endsWith(' ') && !element.innerHTML.endsWith('>')) {
                textToInsert = ' ' + textToInsert;
              }
              
              // Focus the element first
              element.focus();
              
              // Use document.execCommand to insert text
              document.execCommand('insertText', false, textToInsert);
              
              // Manually trigger the form update
              setTimeout(() => {
                const event = new Event('input', { bubbles: true });
                element.dispatchEvent(event);
                
                form.setValue(
                  fieldName,
                  element.innerHTML,
                  { shouldValidate: true, shouldDirty: true }
                );
                
                console.log("Updated editor content with speech:", element.innerHTML);
              }, 10);
            } else {
              console.error("Description element not found");
            }
          } else {
            // For regular form fields
            const currentValue = form.getValues(fieldName) || '';
            
            // Add space if needed (don't add if it's just punctuation or at the beginning)
            let textToAdd = processedText;
            const isJustPunctuation = /^\s*[,.!?:;"'\-\(\)]+\s*$/.test(processedText);
            
            if (!isJustPunctuation && currentValue && !currentValue.endsWith(' ')) {
              textToAdd = ' ' + textToAdd;
            }
            
            form.setValue(
              fieldName, 
              currentValue + textToAdd,
              { shouldValidate: true, shouldDirty: true }
            );
            console.log("Updated form value:", form.getValues(fieldName));
          }
          
          // Save the last transcript
          lastTranscriptRef.current = transcript;
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
            // Reset capitalization for new recording session
            capitalizeNextRef.current = true;
            
            recognitionRef.current?.start();
            setIsRecording(true);
            toast.info("Enregistrement vocal démarré... Parlez clairement dans votre microphone.");
            toast.info("Vous pouvez dicter la ponctuation en disant 'virgule', 'point', etc. ou dire 'à la ligne' pour un retour à la ligne.");
            
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
