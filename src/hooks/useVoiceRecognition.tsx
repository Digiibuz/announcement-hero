
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";

interface VoiceRecognitionOptions {
  fieldName: string;
  form: UseFormReturn<any>;
}

// Define types for the Web Speech API
// This is necessary because TypeScript doesn't include these types by default
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionEventMap {
  audiostart: Event;
  audioend: Event;
  start: Event;
  end: Event;
  error: SpeechRecognitionErrorEvent;
  nomatch: SpeechRecognitionEvent;
  result: SpeechRecognitionEvent;
  soundstart: Event;
  soundend: Event;
  speechstart: Event;
  speechend: Event;
}

interface SpeechRecognition extends EventTarget {
  grammars: any;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof SpeechRecognitionEventMap>(
    type: K,
    listener: (this: SpeechRecognition, ev: SpeechRecognitionEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

const useVoiceRecognition = ({ fieldName, form }: VoiceRecognitionOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTextRef = useRef<string>("");
  const shouldCapitalizeNextRef = useRef<boolean>(true);
  const isFirstWordRef = useRef<boolean>(true);

  // Process speech commands to handle punctuation
  const processCommand = (transcript: string, element: HTMLElement | null): string => {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Define command mappings for punctuation and formatting
    const commands: Record<string, (el: HTMLElement | null) => string> = {
      // Points
      "point": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '. '), '') : '. ';
      },
      "point un": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '. '), '') : '. ';
      },
      
      // Virgules
      "virgule": (el) => el ? (document.execCommand('insertText', false, ', '), '') : ', ',
      "virgule un": (el) => el ? (document.execCommand('insertText', false, ', '), '') : ', ',
      
      // Point-virgule
      "point virgule": (el) => el ? (document.execCommand('insertText', false, '; '), '') : '; ',
      "point virgule un": (el) => el ? (document.execCommand('insertText', false, '; '), '') : '; ',
      
      // Deux-points
      "deux points": (el) => el ? (document.execCommand('insertText', false, ': '), '') : ': ',
      
      // Points d'interrogation
      "point d'interrogation": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '? '), '') : '? ';
      },
      "point interrogation": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '? '), '') : '? ';
      },
      
      // Points d'exclamation
      "point d'exclamation": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '! '), '') : '! ';
      },
      "point exclamation": (el) => {
        shouldCapitalizeNextRef.current = true;
        return el ? (document.execCommand('insertText', false, '! '), '') : '! ';
      },
      
      // Parenthèses
      "ouvrir parenthèse": (el) => el ? (document.execCommand('insertText', false, '('), '') : '(',
      "fermer parenthèse": (el) => el ? (document.execCommand('insertText', false, ') '), '') : ') ',
      "parenthèse ouvrante": (el) => el ? (document.execCommand('insertText', false, '('), '') : '(',
      "parenthèse fermante": (el) => el ? (document.execCommand('insertText', false, ') '), '') : ') ',
      
      // Guillemets
      "ouvrir guillemets": (el) => el ? (document.execCommand('insertText', false, '« '), '') : '« ',
      "fermer guillemets": (el) => el ? (document.execCommand('insertText', false, ' »'), '') : ' »',
      "guillemets ouvrants": (el) => el ? (document.execCommand('insertText', false, '« '), '') : '« ',
      "guillemets fermants": (el) => el ? (document.execCommand('insertText', false, ' »'), '') : ' »',
      
      // Tirets et traits d'union
      "tiret": (el) => el ? (document.execCommand('insertText', false, '-'), '') : '-',
      "tiret cadratin": (el) => el ? (document.execCommand('insertText', false, '—'), '') : '—',
      "tiret demi cadratin": (el) => el ? (document.execCommand('insertText', false, '–'), '') : '–',
      
      // Apostrophe
      "apostrophe": (el) => el ? (document.execCommand('insertText', false, "'"), '') : "'",
      
      // Accolades
      "ouvrir accolade": (el) => el ? (document.execCommand('insertText', false, '{'), '') : '{',
      "fermer accolade": (el) => el ? (document.execCommand('insertText', false, '}'), '') : '}',
      
      // Crochets
      "ouvrir crochet": (el) => el ? (document.execCommand('insertText', false, '['), '') : '[',
      "fermer crochet": (el) => el ? (document.execCommand('insertText', false, ']'), '') : ']',
      
      // Pourcentage
      "pourcent": (el) => el ? (document.execCommand('insertText', false, '%'), '') : '%',
      
      // Symbole euro
      "euro": (el) => el ? (document.execCommand('insertText', false, '€'), '') : '€',
      
      // Symbole dollar
      "dollar": (el) => el ? (document.execCommand('insertText', false, '$'), '') : '$',
      
      // Et commercial
      "et commercial": (el) => el ? (document.execCommand('insertText', false, '&'), '') : '&',
      "esperluette": (el) => el ? (document.execCommand('insertText', false, '&'), '') : '&',
      
      // Saut de ligne - Fixed implementation to properly handle line breaks
      "à la ligne": (el) => {
        if (el) {
          document.execCommand('insertLineBreak', false);
          return '';
        } else {
          return '\n';
        }
      },
      "nouvelle ligne": (el) => {
        if (el) {
          document.execCommand('insertLineBreak', false);
          return '';
        } else {
          return '\n';
        }
      },
      "saut de ligne": (el) => {
        if (el) {
          document.execCommand('insertLineBreak', false);
          return '';
        } else {
          return '\n';
        }
      },
      
      // Paragraphe 
      "nouveau paragraphe": (el) => {
        if (el) {
          document.execCommand('insertHTML', false, '<br><br>');
          return '';
        } else {
          return '\n\n';
        }
      },
      
      // Tabulation
      "tabulation": (el) => el ? (document.execCommand('insertText', false, '\t'), '') : '\t',
      "tab": (el) => el ? (document.execCommand('insertText', false, '\t'), '') : '\t',
      
      // Majuscules sur les prochains mots
      "majuscule": (el) => {
        // Marquer pour le prochain mot
        // Cette commande est spéciale, on retourne un flag pour traiter le prochain mot
        shouldCapitalizeNextRef.current = true;
        return "";
      }
    };
    
    // Check for special command pattern that might be followed by text
    for (const [command, action] of Object.entries(commands)) {
      // Use regex for prefix matching, to handle cases like "point suivi de texte..."
      const commandRegex = new RegExp(`^${command}\\s`, 'i');
      if (commandRegex.test(lowerTranscript)) {
        const remainingText = transcript.substring(command.length).trim();
        const punctuation = action(element);
        
        // If there's remaining text, append it after the punctuation
        // Apply capitalization if needed
        if (remainingText && shouldCapitalizeNextRef.current) {
          const capitalized = remainingText.charAt(0).toUpperCase() + remainingText.slice(1);
          shouldCapitalizeNextRef.current = false;
          isFirstWordRef.current = false;
          return punctuation + (capitalized ? " " + capitalized : "");
        } else {
          return punctuation + (remainingText ? " " + remainingText : "");
        }
      }
    }
    
    // Check for exact command match
    for (const [command, action] of Object.entries(commands)) {
      if (lowerTranscript === command) {
        return action(element);
      }
    }
    
    // Capitalize first word in the transcription if needed
    if (isFirstWordRef.current || shouldCapitalizeNextRef.current) {
      isFirstWordRef.current = false;
      shouldCapitalizeNextRef.current = false;
      return transcript.charAt(0).toUpperCase() + transcript.slice(1);
    }
    
    // No command found, return the original transcript
    return transcript;
  };

  // Helper function to detect ending punctuation
  const hasEndingPunctuation = (text: string): boolean => {
    const trimmedText = text.trim();
    if (!trimmedText) return false;
    
    const lastChar = trimmedText.charAt(trimmedText.length - 1);
    return ['.', '!', '?'].includes(lastChar);
  };

  // Function to focus and place cursor at the end of the content
  const placeCursorAtEnd = (element: HTMLElement | null) => {
    if (!element) return;
    
    // Focus the element
    element.focus();
    
    // Place cursor at the end
    const range = document.createRange();
    const selection = window.getSelection();
    
    // Check if element has child nodes
    if (element.childNodes.length > 0) {
      const lastChild = element.childNodes[element.childNodes.length - 1];
      const offset = lastChild.nodeType === Node.TEXT_NODE ? lastChild.textContent?.length || 0 : 0;
      range.setStart(lastChild, offset);
    } else {
      // If element is empty, just place cursor inside it
      range.setStart(element, 0);
    }
    
    range.collapse(true);
    
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  // Initialize SpeechRecognition
  const initializeRecognition = () => {
    // Check if browser supports the Web Speech API
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.log("Speech recognition not supported in this browser");
      setIsSupported(false);
      return false;
    }
    
    setIsSupported(true);
    
    if (!recognitionRef.current) {
      // Initialize recognition with French language
      recognitionRef.current = new SpeechRecognitionAPI();
      if (recognitionRef.current) {
        recognitionRef.current.lang = 'fr-FR';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        // Set up event handlers
        recognitionRef.current.addEventListener('result', handleRecognitionResult);
        recognitionRef.current.addEventListener('start', () => setIsListening(true));
        recognitionRef.current.addEventListener('end', () => {
          setIsListening(false);
          // Restart recognition if we're still in recording mode
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error) {
              console.error("Error restarting speech recognition:", error);
            }
          }
        });
        recognitionRef.current.addEventListener('soundstart', () => {
          // User started speaking
          setIsProcessing(false);
        });
        recognitionRef.current.addEventListener('soundend', () => {
          // User stopped speaking, now processing the speech
          setIsProcessing(true);
        });
        recognitionRef.current.addEventListener('error', (e) => {
          console.error('Speech recognition error', e);
          setIsListening(false);
          setIsProcessing(false);
          
          // If we're still in recording mode, try to restart
          if (isRecording && recognitionRef.current) {
            try {
              setTimeout(() => {
                if (isRecording && recognitionRef.current) {
                  recognitionRef.current.start();
                }
              }, 500);
            } catch (error) {
              console.error("Error restarting speech recognition after error:", error);
            }
          }
        });
      }
      return true;
    }
    return true;
  };

  // Effect to set up recognition
  useEffect(() => {
    const isInitialized = initializeRecognition();
    
    return () => {
      if (recognitionRef.current) {
        // Clean up event listeners
        recognitionRef.current.removeEventListener('result', handleRecognitionResult);
        recognitionRef.current.abort();
      }
    };
  }, [fieldName, form]);

  // Handle recognition results
  const handleRecognitionResult = (event: SpeechRecognitionEvent) => {
    const results = event.results;
    if (!results.length) return;
    
    const current = results[results.length - 1];
    
    if (current.isFinal) {
      const transcript = current[0].transcript.trim();
      
      if (transcript) {
        const elementId = fieldName;
        const element = document.getElementById(elementId);
        
        // Check if previous text has ending punctuation to determine if we need to capitalize
        const currentValue = element?.isContentEditable 
          ? element.innerHTML 
          : (form.getValues(fieldName) || '');
          
        if (currentValue) {
          shouldCapitalizeNextRef.current = hasEndingPunctuation(currentValue);
          isFirstWordRef.current = false;
        } else {
          // If there's no content yet, first word should be capitalized
          isFirstWordRef.current = true;
        }
        
        if (element && element.isContentEditable) {
          // For contentEditable elements
          const processedText = processCommand(transcript, element);
          if (processedText) {
            document.execCommand('insertText', false, processedText);
            // Place cursor at the end after inserting text
            placeCursorAtEnd(element);
          }
        } else {
          // For regular form inputs
          const formValue = form.getValues(fieldName) || '';
          // Add a space before the new text if there's already text and it doesn't end with a space
          const spacer = formValue && !formValue.endsWith(' ') ? ' ' : '';
          const processedText = processCommand(transcript, null);
          
          // Update the form value
          form.setValue(fieldName, formValue + spacer + processedText, { 
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          
          // Update our reference to the last text
          lastTextRef.current = formValue + spacer + processedText;
          
          // For regular inputs, focus the element after form value update
          setTimeout(() => {
            if (element) {
              element.focus();
              if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                element.selectionStart = element.value.length;
                element.selectionEnd = element.value.length;
              }
            }
          }, 0);
        }
      }
      
      // Set processing to false after final result is processed
      setIsProcessing(false);
    }
  };

  // Start recording
  const startRecording = () => {
    if (!isSupported) {
      toast.error("La dictée vocale n'est pas prise en charge par votre navigateur");
      return;
    }

    // Make sure recognition is initialized
    if (!recognitionRef.current) {
      const isInitialized = initializeRecognition();
      if (!isInitialized) {
        toast.error("Impossible d'initialiser la dictée vocale");
        return;
      }
    }

    if (recognitionRef.current && !isRecording) {
      try {
        // Focus the element when starting recording
        const element = document.getElementById(fieldName);
        if (element) {
          element.focus();
          
          // Check if we need to capitalize the next word based on current content
          const currentValue = element.isContentEditable 
            ? element.innerHTML 
            : (form.getValues(fieldName) || '');
            
          if (!currentValue || currentValue.trim() === '') {
            // If there's no content, first word should be capitalized
            isFirstWordRef.current = true;
            shouldCapitalizeNextRef.current = true;
          } else {
            isFirstWordRef.current = false;
            shouldCapitalizeNextRef.current = hasEndingPunctuation(currentValue);
          }
          
          if (element.isContentEditable) {
            placeCursorAtEnd(element);
          } else if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.selectionStart = element.value.length;
            element.selectionEnd = element.value.length;
          }
        }
        
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success("Dictée vocale activée");
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast.error("Erreur lors de l'activation de la dictée vocale");
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
        setIsProcessing(false);
        toast.info("Dictée vocale désactivée");
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  // Toggle voice recording on/off
  const toggleVoiceRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isListening,
    isProcessing,
    toggleVoiceRecording,
    startRecording,
    stopRecording,
    isSupported
  };
};

export default useVoiceRecognition;
