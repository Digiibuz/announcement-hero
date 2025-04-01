
import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AutomationStatusProps {
  isEnabled: boolean;
  onEnabledChange: (value: boolean) => void;
  hasNecessaryData: boolean;
  isSubmitting: boolean;
  lastAutomationCheck: Date | null;
  onRefresh: () => void;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({
  isEnabled,
  onEnabledChange,
  hasNecessaryData,
  isSubmitting
}) => {
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Label htmlFor="automation-switch" className="text-base">Activer l'automatisation</Label>
            {isEnabled && hasNecessaryData && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Actif
              </Badge>}
            {isEnabled && !hasNecessaryData && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> En attente de données
              </Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Génère automatiquement des brouillons selon la fréquence définie
          </p>
        </div>
        <Switch id="automation-switch" checked={isEnabled} onCheckedChange={onEnabledChange} disabled={isSubmitting} />
      </div>
    </div>;
};

export default AutomationStatus;
