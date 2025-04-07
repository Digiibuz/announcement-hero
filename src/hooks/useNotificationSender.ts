
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
      if (!templateId && (!title || !content || !type)) {
        throw new Error('Soit templateId, soit title, content et type sont requis');
      }

      // Appeler la fonction Supabase pour envoyer la notification à un seul utilisateur
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId,
          title,
          content,
          type,
          templateId,
          metadata,
          sendToAll: false // Explicitement défini à false pour un seul utilisateur
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Notification envoyée');
      return data;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de la notification:', error.message);
      toast.error('Erreur lors de l\'envoi de la notification');
      throw error;
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

      // Appeler directement la fonction Edge avec sendToAll=true
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          sendToAll: true,
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

      toast.success(`Notification envoyée à tous les utilisateurs`);
      return data;
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
