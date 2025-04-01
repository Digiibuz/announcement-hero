
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { Loader2, Timer, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [automationId, setAutomationId] = useState<string | null>(null);
  const [frequencyUnit, setFrequencyUnit] = useState<"days" | "hours" | "minutes">("days");
  const { runScheduler, isRunning, checkSchedulerConfig, timeRemaining, nextGenerationTime } = useTomeScheduler();

  useEffect(() => {
    fetchAutomationSettings();
  }, [configId]);

  // Vérifier régulièrement la configuration du planificateur pour mettre à jour le timer
  useEffect(() => {
    if (isEnabled) {
      // Vérifier la configuration initiale
      checkSchedulerConfig();
      
      // Configurer une vérification périodique
      const interval = setInterval(() => {
        checkSchedulerConfig();
      }, 60000); // Vérifier toutes les minutes
      
      return () => clearInterval(interval);
    }
  }, [isEnabled]);

  const fetchAutomationSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("tome_automation")
        .select("*")
        .eq("wordpress_config_id", configId)
        .single();
      
      if (error) {
        if (error.code !== "PGRST116") { // Code pour "aucun résultat"
          console.error("Erreur lors du chargement des paramètres d'automatisation:", error);
          toast.error("Erreur lors du chargement des paramètres d'automatisation");
        }
        return;
      }
      
      if (data) {
        setAutomationId(data.id);
        setIsEnabled(data.is_enabled);
        
        // Convertir la fréquence en jours/heures/minutes pour l'affichage
        let freqValue = data.frequency;
        let freqUnit: "days" | "hours" | "minutes" = "days";
        
        if (freqValue < 0.042) { // Moins d'une heure (0.042 jours)
          freqValue = Math.round(freqValue * 24 * 60);
          freqUnit = "minutes";
        } else if (freqValue < 1) { // Moins d'un jour
          freqValue = Math.round(freqValue * 24);
          freqUnit = "hours";
        }
        
        setFrequency(freqValue);
        setFrequencyUnit(freqUnit);
        
        // Vérifier la configuration pour actualiser le timer
        if (data.is_enabled) {
          checkSchedulerConfig();
        }
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des paramètres:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAutomationSettings = async () => {
    try {
      setIsSaving(true);
      
      // Convertir la fréquence en jours selon l'unité sélectionnée
      let freqInDays = frequency;
      if (frequencyUnit === "hours") {
        freqInDays = frequency / 24;
      } else if (frequencyUnit === "minutes") {
        freqInDays = frequency / (24 * 60);
      }
      
      const automationData = {
        wordpress_config_id: configId,
        is_enabled: isEnabled,
        frequency: freqInDays
      };
      
      let error;
      
      if (automationId) {
        // Mise à jour d'un paramètre existant
        const { error: updateError } = await supabase
          .from("tome_automation")
          .update(automationData)
          .eq("id", automationId);
          
        error = updateError;
      } else {
        // Création d'un nouveau paramètre
        const { error: insertError } = await supabase
          .from("tome_automation")
          .insert([automationData]);
          
        error = insertError;
      }
      
      if (error) {
        console.error("Erreur Supabase lors de l'enregistrement:", error);
        toast.error(`Erreur d'enregistrement: ${error.message}`);
        throw new Error(`Erreur d'enregistrement: ${error.message}`);
      }
      
      toast.success("Paramètres d'automatisation enregistrés");
      
      // Recharger les paramètres pour récupérer l'ID si c'était une nouvelle entrée
      await fetchAutomationSettings();
      
      // Vérifier la configuration mise à jour (sans générer de contenu)
      if (isEnabled) {
        await checkSchedulerConfig();
      }
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'enregistrement des paramètres:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFrequencyUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as "days" | "hours" | "minutes";
    let newFrequency = frequency;
    
    // Convertir la valeur de fréquence en fonction du changement d'unité
    if (frequencyUnit === "days" && newUnit === "hours") {
      newFrequency = frequency * 24;
    } else if (frequencyUnit === "days" && newUnit === "minutes") {
      newFrequency = frequency * 24 * 60;
    } else if (frequencyUnit === "hours" && newUnit === "days") {
      newFrequency = Math.max(1, Math.round(frequency / 24));
    } else if (frequencyUnit === "hours" && newUnit === "minutes") {
      newFrequency = frequency * 60;
    } else if (frequencyUnit === "minutes" && newUnit === "days") {
      newFrequency = Math.max(1, Math.round(frequency / (24 * 60)));
    } else if (frequencyUnit === "minutes" && newUnit === "hours") {
      newFrequency = Math.max(1, Math.round(frequency / 60));
    }
    
    setFrequency(newFrequency);
    setFrequencyUnit(newUnit);
  };

  const getMinFrequencyValue = () => {
    // Valeurs minimales selon l'unité
    if (frequencyUnit === "days") return 0.042; // 1 heure
    if (frequencyUnit === "hours") return 1; // 1 heure
    return 1; // 1 minute
  };

  const getMaxFrequencyValue = () => {
    // Valeurs maximales selon l'unité
    if (frequencyUnit === "days") return 14; // 14 jours
    if (frequencyUnit === "hours") return 24 * 14; // 14 jours en heures
    return 24 * 60 * 14; // 14 jours en minutes
  };

  const formatNextGenerationTime = () => {
    if (!nextGenerationTime) return null;
    return format(nextGenerationTime, "dd/MM/yyyy HH:mm:ss");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Automatisation des Publications</CardTitle>
          <CardDescription>
            Configurez la génération automatique de contenu à intervalle régulier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-publish" className="text-base">Activer l'automatisation</Label>
                    <p className="text-sm text-muted-foreground">
                      Générez automatiquement du contenu sans intervention manuelle
                    </p>
                  </div>
                  <Switch
                    id="auto-publish"
                    checked={isEnabled}
                    onCheckedChange={setIsEnabled}
                  />
                </div>
                
                {isEnabled && (
                  <>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="frequency" className="text-base">Fréquence de publication</Label>
                      <p className="text-sm text-muted-foreground">
                        Définissez à quelle fréquence générer du nouveau contenu
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="frequency"
                          type="number"
                          value={frequency}
                          onChange={(e) => setFrequency(Number(e.target.value))}
                          min={getMinFrequencyValue()}
                          max={getMaxFrequencyValue()}
                          className="w-24"
                        />
                        <select
                          value={frequencyUnit}
                          onChange={handleFrequencyUnitChange}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="minutes">minutes</option>
                          <option value="hours">heures</option>
                          <option value="days">jours</option>
                        </select>
                      </div>
                    </div>
                    
                    {nextGenerationTime && (
                      <div className="mt-4 p-4 border rounded-md bg-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Prochaine génération</h3>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatNextGenerationTime()}</span>
                          </div>
                          {timeRemaining && (
                            <Badge variant="outline" className="text-sm">
                              Temps restant: {timeRemaining}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => fetchAutomationSettings()}
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={saveAutomationSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les paramètres"
                  )}
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={runScheduler}
                  disabled={isRunning || !isEnabled}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exécution en cours...
                    </>
                  ) : (
                    "Exécuter le planificateur manuellement"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Cette action exécute immédiatement le planificateur sans tenir compte de la fréquence définie
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TomeAutomation;
