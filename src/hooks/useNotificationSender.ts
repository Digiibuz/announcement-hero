
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationType } from './useNotifications';

interface SendNotificationParams {
  userId: string;
  title?: string;
  content?: string;
  type?: NotificationType;
  templateId?: string;
  metadata?: Record<string, any>;
}

export const useNotificationSender = () => {
  const [isSending, setIsSending] = useState(false);

  const sendNotification = async ({
    userId,
    title,
    content,
    type,
    templateId,
    metadata
  }: SendNotificationParams) => {
    try {
      setIsSending(true);

      if (!templateId && (!title || !content || !type)) {
        throw new Error('Soit templateId, soit title, content et type sont requis');
      }

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId,
          title,
          content,
          type,
          templateId,
          metadata
        }
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la notification:', error.message);
      toast.error('Erreur lors de l\'envoi de la notification');
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendNotificationToAllUsers = async ({
    title,
    content,
    type,
    templateId,
    metadata
  }: Omit<SendNotificationParams, 'userId'>) => {
    try {
      setIsSending(true);

      // Récupérer tous les utilisateurs (seulement possible pour les administrateurs)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) {
        throw profilesError;
      }

      // Envoyer la notification à chaque utilisateur
      const promises = profiles.map(profile =>
        sendNotification({
          userId: profile.id,
          title,
          content,
          type,
          templateId,
          metadata
        })
      );

      await Promise.all(promises);

      toast.success(`Notification envoyée à ${profiles.length} utilisateurs`);
      return { success: true, count: profiles.length };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi des notifications:', error.message);
      toast.error('Erreur lors de l\'envoi des notifications');
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendNotification,
    sendNotificationToAllUsers,
    isSending
  };
};
