
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { NotificationType } from '@/hooks/useNotifications';
import { useNotificationSender } from '@/hooks/useNotificationSender';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface UserItem {
  id: string;
  name: string;
  email: string;
}

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
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [templateToSend, setTemplateToSend] = useState<NotificationTemplate | null>(null);
  const [sendToAll, setSendToAll] = useState(false);
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  
  const { sendNotification, sendNotificationToUsers, isSending } = useNotificationSender();

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

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');
        
      if (error) throw error;
      
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Impossible de charger la liste des utilisateurs');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
  }, []);

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

  useEffect(() => {
    if (isSendDialogOpen) {
      setSelectedUserIds([]);
      setSendToAll(false);
      setUserId('');
    }
  }, [isSendDialogOpen]);

  const openTemplateDialog = (template?: NotificationTemplate) => {
    setCurrentTemplate(template || null);
    setIsDialogOpen(true);
  };

  const openDeleteConfirm = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteConfirmOpen(true);
  };

  const openSendDialog = (template: NotificationTemplate) => {
    setTemplateToSend(template);
    setSendToAll(false);
    setUserId('');
    setSelectedUserIds([]);
    setIsSendDialogOpen(true);
  };

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      if (currentTemplate) {
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

      setIsDialogOpen(false);
      fetchTemplates();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du modèle:', error.message);
      toast.error(`Erreur: ${error.message}`);
    }
  };

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

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSendNotification = async () => {
    if (!templateToSend) return;
    
    try {
      if (sendToAll) {
        if (users.length === 0) {
          toast.error('Aucun utilisateur disponible pour envoyer la notification');
          return;
        }
        
        const userIds = users.map(user => user.id);
        
        await sendNotificationToUsers({
          userIds,
          templateId: templateToSend.id
        });
        toast.success('Notification envoyée à tous les utilisateurs');
      } else if (selectedUserIds.length > 0) {
        await sendNotificationToUsers({
          userIds: selectedUserIds,
          templateId: templateToSend.id
        });
        toast.success(`Notification envoyée à ${selectedUserIds.length} utilisateur(s)`);
      } else if (userId) {
        await sendNotification({
          userId,
          templateId: templateToSend.id
        });
        toast.success('Notification envoyée à l\'utilisateur');
      } else {
        toast.error('Veuillez sélectionner au moins un utilisateur');
        return;
      }
      
      setIsSendDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la notification:', error.message);
      toast.error(`Erreur: ${error.message}`);
    }
  };

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
                      onClick={() => openSendDialog(template)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Envoyer
                    </Button>
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

      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Envoyer la notification</DialogTitle>
            <DialogDescription>
              Envoyez le modèle "{templateToSend?.title}" aux utilisateurs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send-to-all"
                  checked={sendToAll}
                  onCheckedChange={setSendToAll}
                />
                <label htmlFor="send-to-all" className="cursor-pointer">
                  Envoyer à tous les utilisateurs
                </label>
              </div>
              
              {!sendToAll && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">
                      Sélectionner des utilisateurs
                    </label>
                    
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                          onClick={() => setOpen(true)}
                        >
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>
                              {selectedUserIds.length 
                                ? `${selectedUserIds.length} utilisateur${selectedUserIds.length > 1 ? 's' : ''} sélectionné${selectedUserIds.length > 1 ? 's' : ''}`
                                : "Sélectionner des utilisateurs"}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        {users.length > 0 ? (
                          <Command>
                            <CommandInput placeholder="Rechercher un utilisateur..." />
                            <CommandEmpty>Aucun utilisateur trouvé.</CommandEmpty>
                            <ScrollArea className="h-72">
                              <CommandGroup>
                                {users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => toggleUserSelection(user.id)}
                                    className="flex items-center gap-2"
                                    value={user.id || ''}
                                  >
                                    <Checkbox 
                                      checked={selectedUserIds.includes(user.id)}
                                      onCheckedChange={() => toggleUserSelection(user.id)}
                                      className="mr-2"
                                    />
                                    <div className="flex flex-col">
                                      <span>{user.name || 'Utilisateur sans nom'}</span>
                                      <span className="text-xs text-muted-foreground">{user.email || 'Sans email'}</span>
                                    </div>
                                    {selectedUserIds.includes(user.id) && (
                                      <Check className="ml-auto h-4 w-4" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </ScrollArea>
                          </Command>
                        ) : (
                          <div className="p-4 text-center">
                            {isLoadingUsers ? (
                              <p>Chargement des utilisateurs...</p>
                            ) : (
                              <p>Aucun utilisateur disponible.</p>
                            )}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-muted-foreground">
                      Sélectionnez un ou plusieurs utilisateurs qui recevront cette notification
                    </p>
                  </div>
                  
                  <div className="text-sm font-medium py-2">
                    OU
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="user-id" className="text-sm font-medium">
                      ID spécifique d'un utilisateur
                    </label>
                    <Input 
                      id="user-id"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="UUID de l'utilisateur"
                      disabled={selectedUserIds.length > 0}
                    />
                    <p className="text-xs text-muted-foreground">
                      Entrez l'identifiant unique d'un utilisateur spécifique
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSendNotification}
              disabled={isSending || (!sendToAll && selectedUserIds.length === 0 && !userId)}
            >
              {isSending ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationTemplates;
