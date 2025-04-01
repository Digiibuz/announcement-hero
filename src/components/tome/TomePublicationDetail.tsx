
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import TomeDescriptionField from "./TomeDescriptionField";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, ArrowLeft, Calendar, SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { TomeGeneration } from "@/types/tome";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const TomePublicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generation, setGeneration] = useState<TomeGeneration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchGeneration = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Récupérer les détails de la génération directement depuis la table tome_generations
        const { data: generationData, error: genError } = await supabase
          .from("tome_generations")
          .select("*")
          .eq("id", id)
          .single();

        if (genError) {
          console.error("Erreur lors du chargement de la publication:", genError);
          toast.error("Erreur lors du chargement de la publication: " + genError.message);
          navigate("/tome");
          return;
        }

        if (!generationData) {
          toast.error("Publication non trouvée");
          navigate("/tome");
          return;
        }

        // Récupérer des informations supplémentaires si nécessaire
        const { data: wpConfig } = await supabase
          .from("wordpress_configs")
          .select("site_url")
          .eq("id", generationData.wordpress_config_id)
          .single();

        const enhancedGeneration: TomeGeneration = {
          ...generationData,
          wordpress_site_url: wpConfig?.site_url || null
        };

        setGeneration(enhancedGeneration);
        form.reset({
          title: enhancedGeneration.title || "",
          content: enhancedGeneration.content || "",
          description: enhancedGeneration.description || "",
        });
      } catch (error: any) {
        console.error("Erreur lors du chargement de la publication:", error);
        toast.error("Erreur lors du chargement de la publication");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGeneration();
  }, [id, navigate]);

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
      description: "",
    },
  });

  const updateGeneration = async (generationId: string, data: any): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("tome_generations")
        .update(data)
        .eq("id", generationId);

      if (error) {
        console.error("Erreur lors de la mise à jour:", error);
        toast.error("Erreur lors de la mise à jour: " + error.message);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans updateGeneration:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return false;
    }
  };

  const onSubmit = async (data: { title: string; content: string; description: string }) => {
    if (!generation || !id) return;
    
    try {
      setIsSubmitting(true);
      
      const success = await updateGeneration(id, {
        title: data.title,
        content: data.content,
        description: data.description,
      });
      
      if (success) {
        toast.success("Publication mise à jour avec succès");
        
        // Mettre à jour l'état local avec les nouvelles données
        setGeneration({
          ...generation,
          title: data.title,
          content: data.content,
          description: data.description
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!generation || !id) return;
    
    try {
      setIsPublishing(true);
      
      // Vérifier que le contenu et le titre sont présents
      if (!generation.title || !generation.content) {
        toast.error("Le titre et le contenu sont obligatoires pour publier");
        return;
      }
      
      // Appeler la fonction Edge Supabase pour publier
      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { generationId: id }
      });
      
      if (error) {
        console.error("Erreur lors de la publication:", error);
        toast.error("Erreur lors de la publication: " + error.message);
        return;
      }
      
      if (data.success === false) {
        toast.error(data.error || "Échec de la publication");
        console.error("Erreur détaillée:", data.technicalError || data.error);
        return;
      }
      
      // Mise à jour du statut dans l'interface
      setGeneration({
        ...generation,
        status: 'published',
        published_at: new Date().toISOString(),
        wordpress_post_id: data.wordpressPostId
      });
      
      toast.success("Publication réussie");
      
      // Rediriger vers la liste des publications après un court délai
      setTimeout(() => {
        navigate("/tome");
      }, 2000);
      
    } catch (error: any) {
      console.error("Erreur lors de la publication:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!generation || !id || !scheduleDate) return;
    
    try {
      setIsScheduling(true);
      
      // Vérifier que le contenu et le titre sont présents
      if (!generation.title || !generation.content) {
        toast.error("Le titre et le contenu sont obligatoires pour planifier");
        return;
      }
      
      // Formater la date pour PostgreSQL
      const formattedDate = format(scheduleDate, "yyyy-MM-dd'T'HH:mm:ss");
      
      // Mise à jour du statut dans la base de données
      const success = await updateGeneration(id, {
        status: "scheduled",
        scheduled_at: formattedDate
      });
      
      if (success) {
        // Mise à jour du statut dans l'interface
        setGeneration({
          ...generation,
          status: 'scheduled',
          scheduled_at: formattedDate
        });
        
        toast.success(`Publication planifiée pour le ${format(scheduleDate, "dd/MM/yyyy HH:mm", { locale: fr })}`);
        
        // Fermer la boîte de dialogue
        setShowScheduleDialog(false);
        
        // Rediriger vers la liste des publications après un court délai
        setTimeout(() => {
          navigate("/tome");
        }, 2000);
      }
      
    } catch (error: any) {
      console.error("Erreur lors de la planification:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!generation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">Publication non trouvée</h3>
            <Button onClick={() => navigate("/tome")}>Retour aux publications</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {generation?.status === "draft" 
            ? "Modifier la publication" 
            : "Détails de la publication"}
        </CardTitle>
        <CardDescription>
          {generation?.status === "draft" 
            ? "Modifiez le contenu avant publication" 
            : "Consultez les détails de cette publication"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Titre de la publication" 
                      {...field} 
                      disabled={generation?.status !== "draft"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contenu de la publication" 
                      value={field.value}
                      onChange={field.onChange}
                      className="min-h-[300px]"
                      disabled={generation?.status !== "draft"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions supplémentaires</FormLabel>
                  <FormControl>
                    <TomeDescriptionField 
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Instructions supplémentaires pour l'IA"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {generation?.status === "draft" && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/tome")}
                >
                  Annuler
                </Button>
                
                {/* Bouton de planification */}
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowScheduleDialog(true)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Planifier
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Planifier la publication</DialogTitle>
                      <DialogDescription>
                        Sélectionnez la date et l'heure de publication
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <div className="flex flex-col space-y-4 items-center">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !scheduleDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduleDate ? (
                                  format(scheduleDate, "PPP HH:mm", { locale: fr })
                                ) : (
                                  <span>Sélectionnez une date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={scheduleDate}
                                onSelect={(date) => {
                                  if (date) {
                                    // Conserver l'heure actuelle si déjà sélectionnée
                                    if (scheduleDate) {
                                      const hours = scheduleDate.getHours();
                                      const minutes = scheduleDate.getMinutes();
                                      date.setHours(hours, minutes);
                                    } else {
                                      // Par défaut, programmer pour maintenant
                                      const now = new Date();
                                      date.setHours(now.getHours(), now.getMinutes());
                                    }
                                    setScheduleDate(date);
                                  }
                                }}
                                disabled={(date) => {
                                  // Désactiver les dates passées
                                  const now = new Date();
                                  now.setHours(0, 0, 0, 0);
                                  return date < now;
                                }}
                                initialFocus
                                locale={fr}
                              />
                              {scheduleDate && (
                                <div className="p-3 border-t border-border">
                                  <div className="flex justify-between items-center">
                                    <span>Heure:</span>
                                    <Input
                                      type="time"
                                      className="w-32"
                                      value={scheduleDate ? format(scheduleDate, "HH:mm") : ""}
                                      onChange={(e) => {
                                        if (scheduleDate && e.target.value) {
                                          const [hours, minutes] = e.target.value.split(":");
                                          const newDate = new Date(scheduleDate);
                                          newDate.setHours(
                                            parseInt(hours, 10),
                                            parseInt(minutes, 10)
                                          );
                                          setScheduleDate(newDate);
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowScheduleDialog(false)}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleSchedule}
                        disabled={!scheduleDate || isScheduling}
                      >
                        {isScheduling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Planification...
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Planifier
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Bouton de publication */}
                <Button 
                  type="button"
                  variant="default"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <SendHorizonal className="mr-2 h-4 w-4" />
                      Publier
                    </>
                  )}
                </Button>
                
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TomePublicationDetail;
