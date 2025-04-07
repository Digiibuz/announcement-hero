
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { NotificationType } from '@/hooks/useNotifications';

interface NotificationTemplate {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  event_trigger?: string;
  frequency_days?: number;
}

// Schéma de validation pour le formulaire
const templateSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  content: z.string().min(10, { message: 'Le contenu doit contenir au moins 10 caractères' }),
  type: z.enum(['info', 'alert', 'reminder'] as const),
  event_trigger: z.string().optional(),
  frequency_days: z.number().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const NotificationTemplates = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<NotificationTemplate | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'info',
      event_trigger: '',
      frequency_days: undefined,
    },
  });

  // Charger les modèles de notifications
  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTemplates(data as unknown as NotificationTemplate[]);
    } catch (error: any) {
      console.error('Erreur lors du chargement des modèles:', error.message);
      toast.error('Erreur lors du chargement des modèles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Réinitialiser le formulaire lors de l'ouverture du dialogue
  useEffect(() => {
    if (isDialogOpen && currentTemplate) {
      form.reset({
        title: currentTemplate.title,
        content: currentTemplate.content,
        type: currentTemplate.type,
        event_trigger: currentTemplate.event_trigger || '',
        frequency_days: currentTemplate.frequency_days,
      });
    } else if (isDialogOpen) {
      form.reset({
        title: '',
        content: '',
        type: 'info',
        event_trigger: '',
        frequency_days: undefined,
      });
    }
  }, [isDialogOpen, currentTemplate, form]);

  // Ouvrir le dialogue pour créer ou éditer un modèle
  const openTemplateDialog = (template?: NotificationTemplate) => {
    setCurrentTemplate(template || null);
    setIsDialogOpen(true);
  };

  // Ouvrir le dialogue de confirmation de suppression
  const openDeleteConfirm = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteConfirmOpen(true);
  };

  // Soumettre le formulaire
  const onSubmit = async (data: TemplateFormValues) => {
    try {
      if (currentTemplate) {
        // Mettre à jour un modèle existant
        const { error } = await supabase
          .from('notification_templates')
          .update({
            title: data.title,
            content: data.content,
            type: data.type,
            event_trigger: data.event_trigger || null,
            frequency_days: data.frequency_days || null,
          } as any)
          .eq('id', currentTemplate.id);

        if (error) throw error;
        toast.success('Modèle de notification mis à jour');
      } else {
        // Créer un nouveau modèle
        const { error } = await supabase
          .from('notification_templates')
          .insert({
            title: data.title,
            content: data.content,
            type: data.type,
            event_trigger: data.event_trigger || null,
            frequency_days: data.frequency_days || null,
          } as any);

        if (error) throw error;
        toast.success('Modèle de notification créé');
      }

      // Fermer le dialogue et rafraîchir la liste
      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du modèle:', error.message);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Supprimer un modèle
  const deleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateToDelete);

      if (error) throw error;
      
      toast.success('Modèle supprimé');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error.message);
      toast.error(`Erreur: ${error.message}`);
    }
  };

  // Afficher un indicateur de type
  const getTypeBadge = (type: NotificationType) => {
    const variants: Record<NotificationType, "default" | "secondary" | "destructive"> = {
      info: "default",
      reminder: "secondary",
      alert: "destructive"
    };
    
    const labels: Record<NotificationType, string> = {
      info: "Information",
      reminder: "Rappel",
      alert: "Alerte"
    };
    
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Modèles de notifications</CardTitle>
            <CardDescription>
              Créez et gérez des modèles de notifications réutilisables
            </CardDescription>
          </div>
          <Button onClick={() => openTemplateDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-6">
              <p>Chargement des modèles...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              <p>Aucun modèle de notification disponible.</p>
              <p className="mt-2">Créez votre premier modèle en cliquant sur "Nouveau modèle".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div 
                  key={template.id}
                  className="border rounded-md p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.title}</h4>
                      {getTypeBadge(template.type)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openTemplateDialog(template)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => openDeleteConfirm(template.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue d'édition / création de modèle */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {currentTemplate ? 'Modifier le modèle' : 'Créer un nouveau modèle'}
            </DialogTitle>
            <DialogDescription>
              {currentTemplate 
                ? 'Modifiez les détails du modèle de notification.' 
                : 'Créez un nouveau modèle de notification réutilisable.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de notification</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="alert">Alerte</SelectItem>
                        <SelectItem value="reminder">Rappel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre du modèle" {...field} />
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
                        placeholder="Contenu de la notification" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Déclencheur d'événement (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nom de l'événement déclencheur" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">
                  {currentTemplate ? 'Mettre à jour' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle de notification ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteTemplate}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationTemplates;
