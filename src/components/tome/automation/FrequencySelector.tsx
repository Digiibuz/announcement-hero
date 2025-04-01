
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FrequencySelectorProps {
  frequency: string;
  onFrequencyChange: (value: string) => void;
  isEnabled: boolean;
  isSubmitting: boolean;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  frequency,
  onFrequencyChange,
  isEnabled,
  isSubmitting
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="frequency-select">Fréquence de génération</Label>
      <Select 
        value={frequency} 
        onValueChange={onFrequencyChange}
        disabled={!isEnabled || isSubmitting}
      >
        <SelectTrigger id="frequency-select">
          <SelectValue placeholder="Sélectionner une fréquence" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.0007">Chaque minute (test)</SelectItem>
          <SelectItem value="0.0014">Toutes les 2 minutes (test)</SelectItem>
          <SelectItem value="0.01">Toutes les 15 minutes (test)</SelectItem>
          <SelectItem value="0.02">Toutes les 30 minutes (test)</SelectItem>
          <SelectItem value="0.05">Toutes les heures (test)</SelectItem>
          <SelectItem value="1">Chaque jour</SelectItem>
          <SelectItem value="2">Tous les 2 jours</SelectItem>
          <SelectItem value="3">Tous les 3 jours</SelectItem>
          <SelectItem value="7">Chaque semaine</SelectItem>
          <SelectItem value="14">Toutes les 2 semaines</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FrequencySelector;
