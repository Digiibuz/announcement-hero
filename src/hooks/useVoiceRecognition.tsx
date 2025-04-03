
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

  // Process speech commands to handle punctuation
  const processCommand = (transcript: string, element: HTMLElement | null): string => {
    // Define command mappings for punctuation and formatting
    const commands: Record<string, (el: HTMLElement | null) => string> = {
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

    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check for commands
    for (const [command, action] of Object.entries(commands)) {
      if (lowerTranscript === command) {
        return action(element);
      }
    }
    
    // No command found, return the original transcript
    return transcript;
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

  // Effect to set up recognition
  useEffect(() => {
    // Check if browser supports the Web Speech API
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.log("Speech recognition not supported in this browser");
      setIsSupported(false);
      return;
    }
    
    setIsSupported(true);
    
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
          recognitionRef.current.start();
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
      });
    }
    
    return () => {
      if (recognitionRef.current) {
        // Clean up event listeners
        recognitionRef.current.removeEventListener('result', handleRecognitionResult);
        recognitionRef.current.abort();
      }
    };
  }, [isRecording, fieldName, form]);

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
          const processedText = processCommand(transcript, null);
          form.setValue(fieldName, formValue + ' ' + processedText, { 
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          
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

  // Toggle voice recording on/off
  const toggleVoiceRecording = () => {
    if (!isSupported) {
      toast.error("La dictée vocale n'est pas prise en charge par votre navigateur");
      return;
    }
    
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      setIsProcessing(false);
      toast.info("Dictée vocale désactivée");
    } else {
      // Start recording
      if (recognitionRef.current) {
        try {
          // Focus the element when starting recording
          const element = document.getElementById(fieldName);
          if (element) {
            element.focus();
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
    }
  };

  return {
    isRecording,
    isListening,
    isProcessing,
    toggleVoiceRecording,
    isSupported
  };
};

export default useVoiceRecognition;
