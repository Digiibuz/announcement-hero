
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useSendCredentials = () => {
  const [isSending, setIsSending] = useState(false);

  const sendCredentials = async (user: UserProfile, password: string) => {
    try {
      setIsSending(true);
      
      // Extract company name and website URL from WordPress config if available
      const companyName = user.wordpressConfig?.name || user.name || 'Votre entreprise';
      const websiteUrl = user.wordpressConfig?.site_url || '';

      console.log('Sending credentials for user:', {
        email: user.email,
        name: user.name,
        companyName,
        websiteUrl
      });

      const { data, error } = await supabase.functions.invoke('send-credentials', {
        body: {
          userEmail: user.email,
          userName: user.name || 'Utilisateur',
          password: password,
          companyName: companyName,
          websiteUrl: websiteUrl
        }
      });

      if (error) {
        console.error('Error calling send-credentials function:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error('L\'envoi de l\'email a échoué');
      }

      toast.success(`Les identifiants ont été envoyés par email à ${user.name}`);
      return true;
    } catch (error: any) {
      console.error('Error sending credentials:', error);
      toast.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendCredentials,
    isSending
  };
};
