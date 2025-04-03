
import React, { useState, useEffect, forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DictationButtonProps extends Omit<ButtonProps, "onLongPress" | "onLongPressEnd"> {
  isRecording: boolean;
  onToggle?: () => void;
  onLongPress?: () => void;
  onLongPressEnd?: () => void;
  className?: string;
}

const DictationButton = forwardRef<HTMLButtonElement, DictationButtonProps>(({
  isRecording,
  onToggle,
  onLongPress,
  onLongPressEnd,
  className,
  ...props
}, ref) => {
  const [longPressActive, setLongPressActive] = useState(false);
  const [scale, setScale] = useState(1);
  const isMobile = useIsMobile();

  // Handle button press events for mobile
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile && onLongPress) {
      setLongPressActive(true);
      onLongPress();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile && longPressActive && onLongPressEnd) {
      setLongPressActive(false);
      onLongPressEnd();
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile && longPressActive && onLongPressEnd) {
      setLongPressActive(false);
      onLongPressEnd();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isMobile && onToggle) {
      onToggle();
    }
  };

  // Animation effect for scale
  useEffect(() => {
    if (longPressActive) {
      // Start animation
      let animationFrame: number;
      const startTime = Date.now();
      const duration = 300; // Animation duration in ms
      const maxScale = 1.2; // Maximum scale value

      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          setScale(1 + (maxScale - 1) * progress);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setScale(maxScale);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      
      return () => {
        cancelAnimationFrame(animationFrame);
        setScale(1); // Reset scale on cleanup
      };
    } else {
      setScale(1);
    }
  }, [longPressActive]);

  // Button style based on recording state
  const buttonVariant = isRecording ? "default" : "outline";
  const buttonClass = cn(
    "relative transition-all",
    isRecording && !isMobile ? "bg-red-500 hover:bg-red-600" : "",
    longPressActive ? "bg-red-500" : "",
    className
  );

  // Dynamic styles for the button
  const buttonStyle = {
    transform: `scale(${scale})`,
    transition: 'transform 0.2s ease-out'
  };

  const tooltipText = isRecording || longPressActive 
    ? "Arrêter la dictée" 
    : isMobile 
      ? "Maintenir pour dicter du texte" 
      : "Dicter du texte";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant={buttonVariant}
            size="icon"
            className={buttonClass}
            style={buttonStyle}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onClick={handleClick}
            {...props}
          >
            {isRecording || longPressActive ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

DictationButton.displayName = "DictationButton";

export default DictationButton;
