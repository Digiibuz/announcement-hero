
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
import { Check, Users } from 'lucide-react';
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
  const [userSelectorOpen, setUserSelectorOpen] = useState(false);
  
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
        
        // S'assurer que data est toujours un tableau valide
        const validUsers = Array.isArray(data) 
          ? data.filter(user => user && typeof user === 'object' && 'id' in user && user.id) 
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

  // Composant simplifié de sélection d'utilisateurs
  const UserSelector = () => {
    if (isLoadingUsers) {
      return (
        <div className="p-4 border rounded-md">
          <p className="text-center">Chargement des utilisateurs...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="p-4 border rounded-md">
          <p className="text-center">Aucun utilisateur disponible</p>
        </div>
      );
    }

    return (
      <div className="border rounded-md">
        <div className="p-2 border-b">
          <Input 
            placeholder="Rechercher un utilisateur..." 
            className="w-full"
          />
        </div>
        <ScrollArea className="h-72">
          <div className="p-2">
            {users.map((user) => (
              <div 
                key={user.id}
                className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={() => toggleUserSelection(user.id)}
              >
                <Checkbox 
                  checked={selectedUserIds.includes(user.id)}
                  onCheckedChange={() => toggleUserSelection(user.id)}
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="font-medium">{user.name || 'Sans nom'}</div>
                  <div className="text-xs text-muted-foreground">{user.email || 'Sans email'}</div>
                </div>
                {selectedUserIds.includes(user.id) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
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
                    
                    <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUserSelectorOpen(!userSelectorOpen)}
                        className={cn(
                          "w-full justify-between",
                          userSelectorOpen && "border-primary"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {selectedUserIds.length 
                              ? `${selectedUserIds.length} utilisateur${selectedUserIds.length > 1 ? 's' : ''} sélectionné${selectedUserIds.length > 1 ? 's' : ''}`
                              : "Sélectionner des utilisateurs"}
                          </span>
                        </div>
                      </Button>
                      
                      {userSelectorOpen && (
                        <div className="mt-2">
                          <UserSelector />
                        </div>
                      )}
                    </div>
                    
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
