
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface AIGenerationSettings {
  tone: string;
  length: string;
}

interface AIGenerationOptionsProps {
  settings: AIGenerationSettings;
  onSettingsChange: (settings: AIGenerationSettings) => void;
}

const AIGenerationOptions = ({ settings, onSettingsChange }: AIGenerationOptionsProps) => {
  const handleToneChange = (tone: string) => {
    onSettingsChange({ ...settings, tone });
  };

  const handleLengthChange = (length: string) => {
    onSettingsChange({ ...settings, length });
  };

  const toneOptions = [
    { value: "convivial", label: "Convivial", description: "Ton chaleureux et accessible" },
    { value: "professionnel", label: "Professionnel", description: "Ton formel et expertisé" },
    { value: "commercial", label: "Commercial", description: "Ton persuasif et vendeur" },
    { value: "informatif", label: "Informatif", description: "Ton neutre et descriptif" }
  ];

  const lengthOptions = [
    { value: "concis", label: "Concis (~100 mots)", description: "Description courte et directe" },
    { value: "standard", label: "Standard (~200 mots)", description: "Équilibre entre détail et lisibilité" },
    { value: "detaille", label: "Détaillé (~300 mots)", description: "Description complète et SEO" }
  ];

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tone-select" className="text-sm font-medium">
              Ton de rédaction
            </Label>
            <Select value={settings.tone} onValueChange={handleToneChange}>
              <SelectTrigger id="tone-select" className="h-11">
                <SelectValue placeholder="Sélectionner un ton" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {toneOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    className="cursor-pointer focus:bg-accent py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="length-select" className="text-sm font-medium">
              Longueur du contenu
            </Label>
            <Select value={settings.length} onValueChange={handleLengthChange}>
              <SelectTrigger id="length-select" className="h-11">
                <SelectValue placeholder="Sélectionner la longueur" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {lengthOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="cursor-pointer focus:bg-accent py-3"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-sm">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIGenerationOptions;
