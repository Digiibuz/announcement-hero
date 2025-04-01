
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
      <Label htmlFor="frequency-select">Generation frequency</Label>
      <Select 
        value={frequency} 
        onValueChange={onFrequencyChange}
        disabled={!isEnabled || isSubmitting}
      >
        <SelectTrigger id="frequency-select">
          <SelectValue placeholder="Select a frequency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.0007">Every minute (test)</SelectItem>
          <SelectItem value="0.0014">Every 2 minutes (test)</SelectItem>
          <SelectItem value="0.01">Every 15 minutes (test)</SelectItem>
          <SelectItem value="0.02">Every 30 minutes (test)</SelectItem>
          <SelectItem value="0.05">Every hour (test)</SelectItem>
          <SelectItem value="1">Every day</SelectItem>
          <SelectItem value="2">Every 2 days</SelectItem>
          <SelectItem value="3">Every 3 days</SelectItem>
          <SelectItem value="7">Every week</SelectItem>
          <SelectItem value="14">Every 2 weeks</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default FrequencySelector;
