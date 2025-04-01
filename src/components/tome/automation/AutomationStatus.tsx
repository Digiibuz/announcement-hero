
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AutomationStatusProps {
  isEnabled: boolean;
  onEnabledChange: (value: boolean) => void;
  hasNecessaryData: boolean;
  isSubmitting: boolean | 'loading' | 'success' | 'error';
  lastAutomationCheck: Date | null;
  onRefresh: () => void;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({
  isEnabled,
  onEnabledChange,
  hasNecessaryData,
  isSubmitting,
  lastAutomationCheck,
  onRefresh
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="automation-switch">Enable automation</Label>
          <p className="text-sm text-muted-foreground">
            Automatically generates drafts according to the defined frequency
          </p>
        </div>
        <Switch
          id="automation-switch"
          checked={isEnabled}
          onCheckedChange={onEnabledChange}
          disabled={!hasNecessaryData || isSubmitting === true || isSubmitting === 'loading'}
        />
      </div>
      
      {lastAutomationCheck && (
        <div className="text-xs text-muted-foreground text-right">
          Last check: {lastAutomationCheck.toLocaleTimeString()}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 ml-1" 
            onClick={onRefresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutomationStatus;
