
import React from "react";
import { Check, Clock, Pencil, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PublishingOptionsProps {
  status: string; 
  onStatusChange: (status: string) => void;
}

const PublishingOptions: React.FC<PublishingOptionsProps> = ({ status, onStatusChange }) => {
  const options = [
    {
      id: "draft",
      icon: <Pencil className="h-4 w-4 mr-2" />,
      label: "Brouillon",
      description: "Sauvegardé localement, pas encore publié",
    },
    {
      id: "published",
      icon: <Send className="h-4 w-4 mr-2" />,
      label: "Publié",
      description: "Visible sur le site web immédiatement",
    },
    {
      id: "scheduled",
      icon: <Clock className="h-4 w-4 mr-2" />,
      label: "Programmé",
      description: "Publication à une date future",
    },
  ];

  return (
    <div className="flex flex-col space-y-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onStatusChange(option.id)}
          className={cn(
            "flex items-start border rounded-md p-3 text-left transition-colors",
            status === option.id
              ? "border-primary bg-primary/5"
              : "border-muted bg-card hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <div className="flex-1 flex items-center">
            <div className="flex-shrink-0 mr-2">
              {option.icon}
            </div>
            <div>
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.description}
              </div>
            </div>
          </div>
          {status === option.id && (
            <Check className="h-4 w-4 text-primary" />
          )}
        </button>
      ))}
    </div>
  );
};

export default PublishingOptions;
