
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Define the type for tome_automation table
interface TomeAutomation {
  id: string;
  wordpress_config_id: string;
  is_enabled: boolean;
  frequency: number;
  created_at: string;
  updated_at: string;
}

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("2"); // jours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, isLoading: isLoadingCategories } = useCategoriesKeywords(configId);
  const { activeLocalities, isLoading: isLoadingLocalities } = useLocalities(configId);
  const { generateContent, runScheduler, checkSchedulerConfig } = useTomeScheduler();

  // Vérifier si l'automatisation est déjà activée à l'initialisation
  useEffect(() => {
    checkAutomationSettings();
  }, [configId]);

  // Récupérer l'état d'automatisation depuis la base de données
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
        // Cast data to the correct type
        const automationData = data as unknown as TomeAutomation;
        setIsEnabled(automationData.is_enabled);
        setFrequency(automationData.frequency.toString());
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres d'automatisation:", error);
    }
  };

  // Enregistrer les paramètres d'automatisation
  const saveAutomationSettings = async () => {
    setIsSubmitting(true);
    try {
      // Convertir frequency en nombre à virgule flottante pour supporter les minutes
      const frequencyNumber = parseFloat(frequency);
      
      console.log("Sauvegarde des paramètres d'automatisation:", {
        configId,
        isEnabled,
        frequency: frequencyNumber
      });
      
      // Vérifier si des entrées existent déjà
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

      // Préparer les données à envoyer
      const automationData: any = {
        is_enabled: isEnabled,
        frequency: frequencyNumber,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingData) {
        // Mettre à jour l'entrée existante
        console.log("Mise à jour d'une entrée existante:", existingData.id);
        result = await supabase
          .from('tome_automation')
          .update(automationData)
          .eq('id', existingData.id);
      } else {
        // Créer une nouvelle entrée
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
      toast.success(`Automatisation ${isEnabled ? 'activée' : 'désactivée'}`);
      
      // Après l'enregistrement, rafraîchir les paramètres
      await checkAutomationSettings();
      
      // Exécuter une vérification de la configuration du planificateur pour valider
      const configValid = await checkSchedulerConfig();
      if (configValid) {
        toast.success("Configuration du planificateur validée avec succès");
      }
      
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'enregistrement des paramètres:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement des paramètres"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Générer manuellement un brouillon avec des mots-clés et localités aléatoires
  const generateRandomDraft = async () => {
    setIsSubmitting(true);
    try {
      if (categories.length === 0) {
        toast.error("Aucune catégorie disponible pour générer du contenu");
        return;
      }

      // Sélectionner une catégorie aléatoire
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];

      // Récupérer tous les mots-clés pour cette catégorie
      const { data: keywordsForCategory } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('category_id', selectedCategory.id);

      // Sélectionner un mot-clé aléatoire si disponible
      let selectedKeywordId = null;
      if (keywordsForCategory && keywordsForCategory.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * keywordsForCategory.length);
        selectedKeywordId = keywordsForCategory[randomKeywordIndex].id;
      }

      // Sélectionner une localité aléatoire si disponible
      let selectedLocalityId = null;
      if (activeLocalities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * activeLocalities.length);
        selectedLocalityId = activeLocalities[randomLocalityIndex].id;
      }

      // Créer une entrée dans la table des générations
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

      // Utiliser useTomeScheduler pour générer le contenu
      const result = await generateContent(generationData.id);
      
      if (result) {
        toast.success("Brouillon généré avec succès");
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

  // Forcer l'exécution du planificateur pour générer immédiatement du contenu
  const forceRunScheduler = async () => {
    setIsSubmitting(true);
    try {
      // Exécuter le planificateur avec forceGeneration=true
      const result = await runScheduler(true);
      
      if (!result) {
        toast.error("Échec de l'exécution du planificateur");
      }
      
      return result;
    } catch (error: any) {
      console.error("Erreur dans forceRunScheduler:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
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
          <Label htmlFor="frequency-select">Fréquence de génération</Label>
          <Select 
            value={frequency} 
            onValueChange={setFrequency}
            disabled={!isEnabled || isSubmitting}
          >
            <SelectTrigger id="frequency-select">
              <SelectValue placeholder="Sélectionner une fréquence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.0007">Toutes les minutes (test)</SelectItem>
              <SelectItem value="0.0014">Toutes les 2 minutes (test)</SelectItem>
              <SelectItem value="0.01">Toutes les 15 minutes (test)</SelectItem>
              <SelectItem value="0.02">Toutes les 30 minutes (test)</SelectItem>
              <SelectItem value="0.05">Toutes les heures (test)</SelectItem>
              <SelectItem value="1">Tous les jours</SelectItem>
              <SelectItem value="2">Tous les 2 jours</SelectItem>
              <SelectItem value="3">Tous les 3 jours</SelectItem>
              <SelectItem value="7">Toutes les semaines</SelectItem>
              <SelectItem value="14">Toutes les 2 semaines</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!hasNecessaryData && (
          <div className="bg-amber-100 text-amber-800 p-3 rounded-md text-sm">
            Vous devez ajouter des catégories et mots-clés avant de pouvoir utiliser l'automatisation.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={generateRandomDraft}
            disabled={!hasNecessaryData || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Générer un brouillon
          </Button>
          <Button 
            variant="outline" 
            onClick={forceRunScheduler}
            disabled={!hasNecessaryData || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Exécuter le planificateur
          </Button>
        </div>
        <Button 
          onClick={saveAutomationSettings}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Enregistrer les paramètres
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TomeAutomation;
