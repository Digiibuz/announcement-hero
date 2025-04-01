
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";
import { toast } from "sonner";
import { Loader2, Copy, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

// Define the type for tome_automation table
interface TomeAutomation {
  id: string;
  wordpress_config_id: string;
  is_enabled: boolean;
  frequency: number;
  created_at: string;
  updated_at: string;
  api_key: string;
}

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("2"); // jours
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { categories, isLoading: isLoadingCategories } = useCategoriesKeywords(configId);
  const { activeLocalities, isLoading: isLoadingLocalities } = useLocalities(configId);
  const { generateContent } = useTomeScheduler();

  // Vérifier si l'automatisation est déjà activée à l'initialisation
  React.useEffect(() => {
    checkAutomationSettings();
  }, [configId]);

  // Récupérer l'état d'automatisation depuis la base de données
  const checkAutomationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('tome_automation' as any)
        .select('*')
        .eq('wordpress_config_id', configId)
        .single();

      if (!error && data) {
        // Cast data to the correct type
        const automationData = data as unknown as TomeAutomation;
        setIsEnabled(automationData.is_enabled);
        setFrequency(automationData.frequency.toString());
        setApiKey(automationData.api_key || null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres d'automatisation:", error);
    }
  };

  // Enregistrer les paramètres d'automatisation
  const saveAutomationSettings = async () => {
    setIsSubmitting(true);
    try {
      // Vérifier si des entrées existent déjà
      const { data: existingData } = await supabase
        .from('tome_automation' as any)
        .select('id')
        .eq('wordpress_config_id', configId);

      if (existingData && existingData.length > 0) {
        // Mettre à jour l'entrée existante
        await supabase
          .from('tome_automation' as any)
          .update({
            is_enabled: isEnabled,
            frequency: parseInt(frequency),
            updated_at: new Date().toISOString()
          })
          .eq('wordpress_config_id', configId);
      } else {
        // Créer une nouvelle entrée
        await supabase
          .from('tome_automation' as any)
          .insert({
            wordpress_config_id: configId,
            is_enabled: isEnabled,
            frequency: parseInt(frequency)
          });
      }

      toast.success(`Automatisation ${isEnabled ? 'activée' : 'désactivée'}`);
      
      // Recharger les paramètres pour obtenir la clé API si elle vient d'être créée
      checkAutomationSettings();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des paramètres:", error);
      toast.error("Erreur lors de l'enregistrement des paramètres");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copier la clé API dans le presse-papiers
  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("Clé API copiée dans le presse-papiers");
    }
  };

  // Régénérer une nouvelle clé API
  const regenerateApiKey = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tome_automation' as any)
        .update({
          api_key: supabase.rpc('gen_random_uuid', {})
        })
        .eq('wordpress_config_id', configId);

      if (error) throw error;
      
      toast.success("Nouvelle clé API générée");
      checkAutomationSettings();
    } catch (error) {
      console.error("Erreur lors de la régénération de la clé API:", error);
      toast.error("Erreur lors de la régénération de la clé API");
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

  const isLoading = isLoadingCategories || isLoadingLocalities;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNecessaryData = categories.length > 0;
  const makeWebhookUrl = "https://hook.eu2.make.com/YOUR_WEBHOOK_ID";

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
              <SelectItem value="1">Tous les jours</SelectItem>
              <SelectItem value="2">Tous les 2 jours</SelectItem>
              <SelectItem value="3">Tous les 3 jours</SelectItem>
              <SelectItem value="7">Toutes les semaines</SelectItem>
              <SelectItem value="14">Toutes les 2 semaines</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {apiKey && (
          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="api-key">Clé API pour Make.com</Label>
            <div className="flex gap-2">
              <Input 
                id="api-key"
                value={apiKey} 
                readOnly 
                className="font-mono text-sm flex-1"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={copyApiKey} 
                title="Copier la clé API"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                Utilisez cette clé API pour déclencher des générations via Make.com
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={regenerateApiKey}
                disabled={isSubmitting}
              >
                Régénérer
              </Button>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-md">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Link className="h-4 w-4 mr-1" />
                Instructions pour Make.com
              </h4>
              <ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1">
                <li>Créez un nouveau scénario dans Make.com</li>
                <li>Ajoutez un déclencheur HTTP</li>
                <li>Configurez une requête HTTP POST vers <code className="bg-slate-100 px-1 rounded">https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/tome-scheduler</code></li>
                <li>Dans le corps de la requête, ajoutez: <code className="bg-slate-100 px-1 rounded">{"{"}"api_key": "{apiKey}"{"}"}}</code></li>
                <li>Configurez le déclencheur pour s'exécuter selon la fréquence souhaitée</li>
              </ol>
            </div>
          </div>
        )}

        {!hasNecessaryData && (
          <div className="bg-amber-100 text-amber-800 p-3 rounded-md text-sm">
            Vous devez ajouter des catégories et mots-clés avant de pouvoir utiliser l'automatisation.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={generateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Générer un brouillon maintenant
        </Button>
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
