
import React from "react";
import { Textarea } from "@/components/ui/textarea";

interface TomeDescriptionFieldProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TomeDescriptionField: React.FC<TomeDescriptionFieldProps> = ({
  value,
  onChange,
  placeholder = "Instructions supplémentaires..."
}) => {
  return (
    <Textarea
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[150px] resize-none"
    />
  );
};

export default TomeDescriptionField;
