
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AutomationActionsProps {
  onGenerateRandomDraft: () => Promise<boolean>;
  onForceRunScheduler: () => Promise<boolean>;
  onSaveSettings: () => Promise<boolean>;
  hasNecessaryData: boolean;
  isSubmitting: boolean;
}

const AutomationActions: React.FC<AutomationActionsProps> = ({
  onGenerateRandomDraft,
  onForceRunScheduler,
  onSaveSettings,
  hasNecessaryData,
  isSubmitting
}) => {
  return (
    <div className="flex justify-between flex-wrap gap-2">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={onGenerateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generate a draft
        </Button>
        <Button 
          variant="outline" 
          onClick={onForceRunScheduler}
          disabled={!hasNecessaryData || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Run scheduler
        </Button>
      </div>
      <Button 
        onClick={onSaveSettings}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save settings
      </Button>
    </div>
  );
};

export default AutomationActions;
