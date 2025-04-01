
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from "lucide-react";

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
          <SelectItem value="1">Chaque jour</SelectItem>
          <SelectItem value="2">Tous les 2 jours</SelectItem>
          <SelectItem value="3">Tous les 3 jours</SelectItem>
          <SelectItem value="7">Chaque semaine</SelectItem>
          <SelectItem value="14">Toutes les 2 semaines</SelectItem>
          <SelectItem value="30">Chaque mois</SelectItem>
          {/* Options pour test uniquement */}
          <SelectItem value="0.042">Chaque heure (test)</SelectItem>
          <SelectItem value="0.0083">Toutes les 12 minutes (test)</SelectItem>
          <SelectItem value="0.0021">Toutes les 3 minutes (test)</SelectItem>
          <SelectItem value="0.00069">Chaque minute (test)</SelectItem>
        </SelectContent>
      </Select>
      
      {frequency === "0.0021" && (
        <div className="flex items-start mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <p>
            Avec cette fréquence de 3 minutes, le planificateur vérifiera toutes les 3 minutes si une génération est nécessaire. 
            <strong> N'oubliez pas de sauvegarder vos paramètres</strong> pour que l'automatisation prenne effet.
          </p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-1">
        {frequency === "0.00069" || frequency === "0.0021" || frequency === "0.0083" || frequency === "0.042" ? (
          <span className="text-amber-600">
            Options de test: activez uniquement pour tester l'automatisation. Des valeurs trop basses peuvent générer trop de contenu.
          </span>
        ) : (
          <span>
            Le système générera automatiquement un brouillon selon cette fréquence lorsque l'automatisation est activée.
          </span>
        )}
      </p>
    </div>
  );
};

export default FrequencySelector;
