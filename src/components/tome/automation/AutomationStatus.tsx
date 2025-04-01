
import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, CheckCircle, AlertTriangle, Clock, XCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface AutomationStatusProps {
  isEnabled: boolean;
  onEnabledChange: (value: boolean) => void;
  hasNecessaryData: boolean;
  isSubmitting: boolean;
  lastAutomationCheck: Date | null;
  onRefresh: () => void;
  frequency: string;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({
  isEnabled,
  onEnabledChange,
  hasNecessaryData,
  isSubmitting,
  lastAutomationCheck,
  onRefresh,
  frequency
}) => {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const lastCheckRef = useRef<Date | null>(null);
  const frequencyMinutesRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  
  // Format the last check time
  const formatLastCheck = () => {
    if (!lastAutomationCheck) return "Jamais";
    
    // Format the date to a user-friendly string
    return lastAutomationCheck.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Format the countdown
  const formatCountdown = () => {
    if (countdown === null) return "En attente...";
    
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate next run time
  useEffect(() => {
    // Stocker la dernière vérification dans une ref pour éviter les recalculs inutiles
    if (lastAutomationCheck && (!lastCheckRef.current || 
        lastAutomationCheck.getTime() !== lastCheckRef.current.getTime())) {
      lastCheckRef.current = lastAutomationCheck;
    }
    
    // Nettoyer l'intervalle existant
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (!isEnabled || !hasNecessaryData) {
      setCountdown(null);
      setProgress(0);
      return;
    }
    
    const frequencyValue = parseFloat(frequency);
    if (isNaN(frequencyValue) || frequencyValue <= 0) return;
    
    // Stocker la fréquence en minutes dans une ref pour la stabilité
    const frequencyInMinutes = frequencyValue * 24 * 60;
    frequencyMinutesRef.current = frequencyInMinutes;
    
    const updateCountdown = () => {
      if (!lastCheckRef.current) return;
      
      const now = new Date();
      const nextRunTime = new Date(lastCheckRef.current.getTime() + (frequencyMinutesRef.current * 60 * 1000));
      const diffMs = nextRunTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        setCountdown(0);
        setProgress(100);
        return;
      }
      
      const diffSeconds = Math.floor(diffMs / 1000);
      setCountdown(diffSeconds);
      
      // Calculate progress percentage (inverse, going from 0 to 100 as time passes)
      const totalSeconds = frequencyMinutesRef.current * 60;
      const elapsedSeconds = totalSeconds - diffSeconds;
      const progressPercentage = (elapsedSeconds / totalSeconds) * 100;
      setProgress(Math.min(progressPercentage, 100));
    };
    
    // Initialiser le compte à rebours immédiatement
    updateCountdown();
    
    // Mettre à jour le compte à rebours chaque seconde
    timerRef.current = window.setInterval(updateCountdown, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isEnabled, hasNecessaryData, frequency]);

  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Label htmlFor="automation-switch" className="text-base">Activer l'automatisation</Label>
            {isEnabled && hasNecessaryData && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Actif
              </Badge>}
            {isEnabled && !hasNecessaryData && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> En attente de données
              </Badge>}
            {!isEnabled && <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                <XCircle className="h-3 w-3 mr-1" /> Inactif
              </Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Génère automatiquement des brouillons selon la fréquence définie
          </p>
        </div>
        <Switch id="automation-switch" checked={isEnabled} onCheckedChange={onEnabledChange} disabled={isSubmitting} />
      </div>
      
      {isEnabled && hasNecessaryData && countdown !== null && (
        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Prochaine génération dans</span>
            </div>
            <span className="text-lg font-bold font-mono text-blue-700">{formatCountdown()}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-500 mt-2">
            Le planificateur vérifiera automatiquement si une génération est nécessaire à la fin du compte à rebours
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Dernière vérification: {formatLastCheck()}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isSubmitting}>
                <RefreshCw className={`h-4 w-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Rafraîchir l'état de l'automatisation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isEnabled && hasNecessaryData && 
        <div className="text-xs text-green-600 italic border-t pt-2">
          <p>Le planificateur vérifiera si une génération est nécessaire à l'expiration du compte à rebours. Assurez-vous d'avoir sauvegardé vos paramètres.</p>
        </div>
      }
    </div>;
};

export default AutomationStatus;
