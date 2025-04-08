
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationType } from '@/types/notifications';

interface SendNotificationParams {
  userId: string;
  title?: string;
  content?: string;
  type?: NotificationType;
  templateId?: string;
  metadata?: Record<string, any>;
}

interface SendNotificationToUsersParams {
  userIds: string[];
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
          sendToUsers: false
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
    }
  };

  const sendNotificationToUsers = async ({
    userIds,
    title,
    content,
    type,
    templateId,
    metadata
  }: SendNotificationToUsersParams) => {
    try {
      setIsSending(true);

      if (!templateId && (!title || !content || !type)) {
        throw new Error('Soit templateId, soit title, content et type sont requis');
      }

      if (!userIds || userIds.length === 0) {
        throw new Error('La liste des utilisateurs ne peut pas être vide');
      }

      // Appeler la fonction Edge avec la liste des utilisateurs spécifiques
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userIds,
          title,
          content,
          type,
          templateId,
          metadata,
          sendToUsers: true
        }
      });

      if (error) {
        throw error;
      }

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
    sendNotificationToUsers,
    isSending
  };
};
