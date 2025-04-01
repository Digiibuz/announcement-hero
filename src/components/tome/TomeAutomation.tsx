
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { toast } from "sonner";
import { Loader2, Clock, PlayCircle, Pause, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("2"); // minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGenerationTime, setLastGenerationTime] = useState<Date | null>(null);
  const { categories, isLoading: isLoadingCategories } = useCategoriesKeywords(configId);
  const { activeLocalities, isLoading: isLoadingLocalities } = useLocalities(configId);
  const { 
    generateContent, 
    runScheduler, 
    isRunning, 
    countdown, 
    isAutoGenerating, 
    startAutoGeneration, 
    stopAutoGeneration 
  } = useTomeScheduler();

  useEffect(() => {
    checkAutomationSettings();
    fetchLastGenerationTime();
  }, [configId]);

  const checkAutomationSettings = async () => {
    try {
      console.log("Vérification des paramètres d'automatisation pour configId:", configId);
      
      const { data, error } = await supabase
        .from('tome_automation')
        .select('*')
        .eq('wordpress_config_id', configId)
        .maybeSingle();

      console.log("Résultat de la vérification:", { data, error });

      if (!error && data) {
        setIsEnabled(data.is_enabled);
        setFrequency(data.frequency.toString());
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres d'automatisation:", error);
    }
  };

  const fetchLastGenerationTime = async () => {
    try {
      const { data, error } = await supabase
        .from('tome_generations')
        .select('created_at')
        .eq('wordpress_config_id', configId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const lastGenDate = new Date(data[0].created_at);
        setLastGenerationTime(lastGenDate);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la dernière génération:", error);
    }
  };

  const saveAutomationSettings = async () => {
    setIsSubmitting(true);
    try {
      const frequencyNumber = parseFloat(frequency);
      
      console.log("Sauvegarde des paramètres d'automatisation:", {
        configId,
        isEnabled,
        frequency: frequencyNumber
      });
      
      const { data: existingData, error: checkError } = await supabase
        .from('tome_automation')
        .select('id')
        .eq('wordpress_config_id', configId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Erreur lors de la vérification des données existantes:", checkError);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }

      console.log("Données existantes:", existingData);

      const automationData = {
        is_enabled: isEnabled,
        frequency: frequencyNumber,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingData) {
        console.log("Mise à jour d'une entrée existante:", existingData.id);
        result = await supabase
          .from('tome_automation')
          .update(automationData)
          .eq('id', existingData.id);
      } else {
        console.log("Création d'une nouvelle entrée");
        result = await supabase
          .from('tome_automation')
          .insert({
            wordpress_config_id: configId,
            is_enabled: isEnabled,
            frequency: frequencyNumber
          });
      }

      if (result.error) {
        console.error("Erreur Supabase lors de l'enregistrement:", result.error);
        throw new Error(`Erreur d'enregistrement: ${result.error.message}`);
      }

      console.log("Résultat de l'opération:", result);
      
      if (isEnabled) {
        // Démarrer l'autogénération avec la fréquence spécifiée
        startAutoGeneration(frequencyNumber);
        toast.success(`Automatisation activée avec fréquence de ${frequencyNumber} minute(s)`);
      } else {
        // Arrêter l'autogénération
        stopAutoGeneration();
        toast.info("Automatisation désactivée");
      }
      
      fetchLastGenerationTime();
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'enregistrement des paramètres:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement des paramètres"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateRandomDraft = async () => {
    setIsSubmitting(true);
    try {
      if (categories.length === 0) {
        toast.error("Aucune catégorie disponible pour générer du contenu");
        return;
      }

      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];

      const { data: keywordsForCategory } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('category_id', selectedCategory.id);

      let selectedKeywordId = null;
      if (keywordsForCategory && keywordsForCategory.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * keywordsForCategory.length);
        selectedKeywordId = keywordsForCategory[randomKeywordIndex].id;
      }

      let selectedLocalityId = null;
      if (activeLocalities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * activeLocalities.length);
        selectedLocalityId = activeLocalities[randomLocalityIndex].id;
      }

      const { data: generationData, error: generationError } = await supabase
        .from('tome_generations')
        .insert({
          wordpress_config_id: configId,
          category_id: selectedCategory.id,
          keyword_id: selectedKeywordId,
          locality_id: selectedLocalityId,
          status: 'pending'
        })
        .select()
        .single();

      if (generationError) {
        throw generationError;
      }

      if (!generationData) {
        throw new Error("Échec de la création de la génération");
      }

      const result = await generateContent(generationData.id);
      
      if (result) {
        toast.success("Brouillon généré avec succès");
        fetchLastGenerationTime();
      } else {
        toast.error("Échec de la génération du brouillon");
      }
    } catch (error: any) {
      console.error("Erreur lors de la génération du brouillon:", error);
      toast.error("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const forceRunScheduler = async () => {
    setIsSubmitting(true);
    try {
      const result = await runScheduler(true);
      
      if (result) {
        toast.success("Exécution du planificateur forcée avec succès");
        fetchLastGenerationTime();
      }
    } catch (error: any) {
      console.error("Erreur lors de l'exécution forcée du planificateur:", error);
      toast.error("Erreur: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formater le temps restant en minutes:secondes
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const isLoading = isLoadingCategories || isLoadingLocalities;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNecessaryData = categories.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatisation des publications</CardTitle>
        <CardDescription>
          Configurez la génération automatique de brouillons avec des mots-clés et localités aléatoires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="automation-switch">Activer l'automatisation</Label>
            <p className="text-sm text-muted-foreground">
              Génère automatiquement des brouillons selon la fréquence définie
            </p>
          </div>
          <Switch
            id="automation-switch"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            disabled={!hasNecessaryData || isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency-select">Fréquence de génération (minutes)</Label>
          <Select 
            value={frequency} 
            onValueChange={setFrequency}
            disabled={!isEnabled || isSubmitting}
          >
            <SelectTrigger id="frequency-select">
              <SelectValue placeholder="Sélectionner une fréquence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 minute</SelectItem>
              <SelectItem value="2">2 minutes</SelectItem>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 heure</SelectItem>
              <SelectItem value="120">2 heures</SelectItem>
              <SelectItem value="360">6 heures</SelectItem>
              <SelectItem value="720">12 heures</SelectItem>
              <SelectItem value="1440">24 heures</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isAutoGenerating && countdown !== null && (
          <div className="bg-primary/10 p-4 rounded-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Timer className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Autogénération active</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={stopAutoGeneration}
                className="h-8"
              >
                <Pause className="h-4 w-4 mr-1" /> Arrêter
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="text-2xl font-bold text-primary">
                {formatCountdown(countdown)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Prochain brouillon dans {formatCountdown(countdown)}
            </div>
          </div>
        )}
        
        {lastGenerationTime && (
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Dernière génération: {format(lastGenerationTime, "dd/MM/yyyy à HH:mm:ss", { locale: fr })}</span>
            </div>
          </div>
        )}

        {!hasNecessaryData && (
          <div className="bg-amber-100 text-amber-800 p-3 rounded-md text-sm">
            Vous devez ajouter des catégories et mots-clés avant de pouvoir utiliser l'automatisation.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button 
          variant="outline" 
          onClick={generateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting || isRunning}
          className="w-full sm:w-auto"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Générer un brouillon maintenant
        </Button>
        <Button 
          variant="outline"
          onClick={forceRunScheduler}
          disabled={!hasNecessaryData || isSubmitting || isRunning}
          className="w-full sm:w-auto"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Exécuter planificateur
        </Button>
        <Button 
          onClick={saveAutomationSettings}
          disabled={isSubmitting || isRunning}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enregistrer les paramètres
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TomeAutomation;
