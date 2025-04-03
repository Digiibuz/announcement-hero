
import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface DictationButtonProps extends Omit<ButtonProps, 'onClick'> {
  isRecording: boolean;
  isSupported: boolean;
  toggle: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

const DictationButton = forwardRef<HTMLButtonElement, DictationButtonProps>(({
  isRecording,
  isSupported,
  toggle,
  startRecording,
  stopRecording,
  className,
  ...props
}, ref) => {
  const [isPressing, setIsPressing] = useState(false);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  // Handle press events differently on mobile vs desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isSupported) return;
    
    if (isMobile) {
      setIsPressing(true);
      // Only start recording on mobile
      startRecording();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSupported) return;
    
    if (isMobile) {
      setIsPressing(false);
      // Only stop recording on pointer up on mobile
      stopRecording();
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (isMobile && isPressing) {
      setIsPressing(false);
      stopRecording();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isSupported) return;
    
    // Only toggle recording on desktop (non-mobile)
    if (!isMobile) {
      toggle();
    }
  };

  // Determine button styles based on state
  const getButtonStyles = () => {
    if (isRecording) {
      return "bg-red-500 hover:bg-red-600 text-white";
    }
    return "";
  };

  // Calculate scale based on pressing state
  const getScale = () => {
    if (isMobile && isPressing) {
      return "scale-125";
    }
    return "scale-100";
  };

  if (!isSupported) return null;

  return (
    <Button
      ref={ref}
      type="button"
      variant={isRecording ? "default" : "outline"}
      size="icon"
      className={cn(
        "h-8 w-8 transition-all duration-200",
        getButtonStyles(),
        getScale(),
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      {...props}
    >
      {isRecording ? (
        <MicOff size={16} className="transition-transform duration-200" />
      ) : (
        <Mic size={16} className="transition-transform duration-200" />
      )}
    </Button>
  );
});

DictationButton.displayName = "DictationButton";

export default DictationButton;
