
import React, { useState, useEffect } from 'react';
import { useNotificationSender } from '@/hooks/useNotificationSender';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { NotificationType } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Check, ChevronsUpDown, Users } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Schéma de validation pour le formulaire
const notificationSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  content: z.string().min(10, { message: 'Le contenu doit contenir au moins 10 caractères' }),
  type: z.enum(['info', 'alert', 'reminder'] as const),
  sendToMultiple: z.boolean().default(false),
  userId: z.string().optional(),
  selectedUserIds: z.array(z.string()).optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface UserItem {
  id: string;
  name: string;
  email: string;
}

const NotificationSender = () => {
  const { sendNotification, sendNotificationToUsers, isSending } = useNotificationSender();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [open, setOpen] = useState(false);
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'info',
      sendToMultiple: false,
      userId: '',
      selectedUserIds: [],
    },
  });

  const sendToMultiple = form.watch('sendToMultiple');
  const selectedUserIds = form.watch('selectedUserIds') || [];

  // Charger la liste des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        // Ensure data is always an array and all items have valid IDs
        const validUsers = Array.isArray(data) 
          ? data.filter(user => user && user.id) 
          : [];
        
        setUsers(validUsers);
      } catch (error: any) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast.error('Impossible de charger la liste des utilisateurs');
        setUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, []);

  const onSubmit = async (data: NotificationFormValues) => {
    try {
      const { title, content, type, sendToMultiple, userId, selectedUserIds } = data;
      
      if (sendToMultiple) {
        if (!selectedUserIds || selectedUserIds.length === 0) {
          toast.error('Veuillez sélectionner au moins un utilisateur');
          return;
        }
        
        await sendNotificationToUsers({
          userIds: selectedUserIds,
          title,
          content,
          type: type as NotificationType,
        });
        
        toast.success(`Notification envoyée à ${selectedUserIds.length} utilisateur(s)`);
      } else if (userId) {
        await sendNotification({
          userId,
          title,
          content,
          type: type as NotificationType,
        });
        toast.success('Notification envoyée à l\'utilisateur');
      } else {
        toast.error('Veuillez spécifier un ID d\'utilisateur');
        return;
      }
      
      form.reset({
        title: '',
        content: '',
        type: 'info',
        sendToMultiple: false,
        userId: '',
        selectedUserIds: [],
      });
    } catch (error: any) {
      toast.error(`Erreur lors de l'envoi de la notification: ${error.message}`);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const currentSelected = form.getValues('selectedUserIds') || [];
    
    if (currentSelected.includes(userId)) {
      form.setValue('selectedUserIds', currentSelected.filter(id => id !== userId));
    } else {
      form.setValue('selectedUserIds', [...currentSelected, userId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer une notification</CardTitle>
        <CardDescription>
          Envoyez une notification instantanée à un ou plusieurs utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormDescription>
                    Le type détermine l'apparence et l'importance de la notification
                  </FormDescription>
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
                    <Input placeholder="Titre de la notification" {...field} />
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
              name="sendToMultiple"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Envoyer à plusieurs utilisateurs</FormLabel>
                    <FormDescription>
                      Activez cette option pour sélectionner plusieurs destinataires
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {sendToMultiple ? (
              <FormField
                control={form.control}
                name="selectedUserIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sélectionner les destinataires</FormLabel>
                    <FormDescription>
                      Choisissez un ou plusieurs utilisateurs qui recevront cette notification
                    </FormDescription>
                    
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
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
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        {isLoadingUsers ? (
                          <div className="p-4 text-center">
                            <p>Chargement des utilisateurs...</p>
                          </div>
                        ) : users.length > 0 ? (
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
                            <p>Aucun utilisateur disponible.</p>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sélectionner un utilisateur</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length > 0 ? (
                          users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || 'Utilisateur sans nom'} ({user.email || 'Sans email'})
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            {isLoadingUsers ? 'Chargement...' : 'Aucun utilisateur disponible'}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choisissez l'utilisateur qui recevra cette notification
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSending}
            >
              {isSending ? 'Envoi en cours...' : 'Envoyer la notification'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default NotificationSender;
