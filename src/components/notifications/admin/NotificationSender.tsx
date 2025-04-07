
import React from 'react';
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

// Schéma de validation pour le formulaire
const notificationSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  content: z.string().min(10, { message: 'Le contenu doit contenir au moins 10 caractères' }),
  type: z.enum(['info', 'alert', 'reminder'] as const),
  sendToAll: z.boolean().default(true),
  userId: z.string().optional(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

const NotificationSender = () => {
  const { sendNotification, sendNotificationToAllUsers, isSending } = useNotificationSender();
  
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'info',
      sendToAll: true,
      userId: '',
    },
  });

  const sendToAll = form.watch('sendToAll');

  const onSubmit = async (data: NotificationFormValues) => {
    try {
      const { title, content, type, sendToAll, userId } = data;
      
      if (sendToAll) {
        await sendNotificationToAllUsers({
          title,
          content,
          type: type as NotificationType,
        });
        toast.success('Notification envoyée à tous les utilisateurs');
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
      
      // Réinitialiser le formulaire
      form.reset({
        title: '',
        content: '',
        type: 'info',
        sendToAll: true,
        userId: '',
      });
    } catch (error: any) {
      toast.error(`Erreur lors de l'envoi de la notification: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer une notification</CardTitle>
        <CardDescription>
          Envoyez une notification instantanée à un utilisateur spécifique ou à tous les utilisateurs
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
              name="sendToAll"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Envoyer à tous les utilisateurs</FormLabel>
                    <FormDescription>
                      Activez cette option pour envoyer la notification à tous les utilisateurs
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
            
            {!sendToAll && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID de l'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="ID de l'utilisateur" {...field} />
                    </FormControl>
                    <FormDescription>
                      Entrez l'identifiant UUID de l'utilisateur destinataire
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
