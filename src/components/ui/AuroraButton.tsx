
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Iridescence from "@/components/ui/Iridescence";
import { cn } from "@/lib/utils";

interface AuroraButtonProps {
  onClick?: () => void;
  className?: string;
}

const AuroraButton = ({ onClick, className }: AuroraButtonProps) => {
  return (
    <Button
      variant="ghost"
      className={cn(
        "relative flex flex-col items-center justify-center h-12 w-12 rounded-lg transition-all duration-200 overflow-hidden text-white shadow-lg scale-105 hover:opacity-90",
        className
      )}
      onClick={onClick}
    >
      {/* Iridescence background effect */}
      <Iridescence
        color={[0.58, 0.23, 0.91]} // Purple color
        speed={0.5}
        amplitude={0.3}
        mouseReact={true}
        className="rounded-lg"
      />
      
      {/* Plus icon */}
      <div className="relative z-10 flex flex-col items-center gap-0.5">
        <Plus className="h-5 w-5" />
      </div>
    </Button>
  );
};

export default AuroraButton;
