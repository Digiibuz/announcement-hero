
import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AutomationStatusProps {
  isEnabled: boolean;
  onEnabledChange: (value: boolean) => void;
  hasNecessaryData: boolean;
  isSubmitting: boolean;
  lastAutomationCheck: Date | null;
  frequency: string;
  onRefresh: () => void;
}

const AutomationStatus: React.FC<AutomationStatusProps> = ({
  isEnabled,
  onEnabledChange,
  hasNecessaryData,
  isSubmitting,
  lastAutomationCheck,
  frequency,
  onRefresh
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const frequencyInMinutes = useRef(parseFloat(frequency) * 24 * 60);
  const lastCheckRef = useRef(lastAutomationCheck);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when props change
  useEffect(() => {
    frequencyInMinutes.current = parseFloat(frequency) * 24 * 60;
  }, [frequency]);

  useEffect(() => {
    lastCheckRef.current = lastAutomationCheck;
  }, [lastAutomationCheck]);

  // Set up the countdown timer
  useEffect(() => {
    if (!isEnabled || !hasNecessaryData) {
      setTimeRemaining(null);
      setProgress(0);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial calculation 
    const calculateTimeRemaining = () => {
      if (!lastCheckRef.current) {
        return null;
      }

      const now = new Date();
      const lastCheck = new Date(lastCheckRef.current);
      
      // Calculate elapsed minutes since last check
      const elapsedMinutes = (now.getTime() - lastCheck.getTime()) / (1000 * 60);
      
      // Calculate remaining minutes
      const remainingMinutes = Math.max(0, frequencyInMinutes.current - elapsedMinutes);
      
      // Calculate progress percentage (inverse of remaining time)
      const progressValue = Math.min(100, Math.max(0, 
        ((frequencyInMinutes.current - remainingMinutes) / frequencyInMinutes.current) * 100
      ));
      
      setProgress(progressValue);
      return remainingMinutes;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Set up interval to update every second
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
      
      // If time's up, refresh
      if (remaining !== null && remaining <= 0) {
        onRefresh();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled, hasNecessaryData, onRefresh]);

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes < 1) {
      return "moins d'une minute";
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    
    return `${remainingMinutes} min`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Label htmlFor="automation-switch" className="text-base">Activer l'automatisation</Label>
            {isEnabled && hasNecessaryData && 
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Actif
              </Badge>
            }
            {isEnabled && !hasNecessaryData && 
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="h-3 w-3 mr-1" /> En attente de données
              </Badge>
            }
          </div>
          <p className="text-sm text-muted-foreground">
            Génère automatiquement des brouillons selon la fréquence définie
          </p>
        </div>
        <Switch 
          id="automation-switch" 
          checked={isEnabled} 
          onCheckedChange={onEnabledChange} 
          disabled={isSubmitting} 
        />
      </div>

      {isEnabled && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Prochaine génération :</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh} 
              disabled={isSubmitting}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSubmitting ? 'animate-spin' : ''}`} />
              Rafraîchir
            </Button>
          </div>
          
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {lastAutomationCheck ? (
                <span>Dernière vérification : {formatDistanceToNow(new Date(lastAutomationCheck), { 
                  addSuffix: true, locale: fr 
                })}</span>
              ) : (
                <span>Pas encore vérifié</span>
              )}
              
              {timeRemaining !== null ? (
                <span>
                  {timeRemaining <= 0 
                    ? "Génération imminente..." 
                    : `Dans ${formatTimeRemaining(timeRemaining)}`}
                </span>
              ) : (
                <span>Minuteur non actif</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationStatus;
