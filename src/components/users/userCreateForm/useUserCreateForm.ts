
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UserCreateFormValues } from "./formSchema";

interface UseUserCreateFormProps {
  form: UseFormReturn<UserCreateFormValues>;
  onUserCreated: () => void;
  onDialogClose: () => void;
}

export const useUserCreateForm = ({ 
  form, 
  onUserCreated, 
  onDialogClose 
}: UseUserCreateFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: UserCreateFormValues) => {
    try {
      setIsSubmitting(true);
      onDialogClose();
      
      const toastId = toast.loading("Création de l'utilisateur en cours...");
      
      console.log("[UserCreateForm] Début de la soumission du formulaire");
      console.log("[UserCreateForm] Données du formulaire:", JSON.stringify(values, null, 2));
      
      // Properly handle wordpressConfigId
      const wordpressConfigId = values.wordpressConfigId === "none" || !values.wordpressConfigId 
                              ? null 
                              : values.wordpressConfigId;
      
      console.log("[UserCreateForm] WordPress config ID après traitement:", wordpressConfigId);
      
      const requestPayload = {
        email: values.email,
        name: values.name,
        password: values.password,
        role: values.role,
        wordpressConfigId: wordpressConfigId,
      };
      
      console.log("[UserCreateForm] Payload envoyé à l'Edge function:", JSON.stringify(requestPayload, null, 2));
      
      const { data, error: functionCallError } = await supabase.functions.invoke("create-user", {
        body: requestPayload,
      });
      
      console.log("[UserCreateForm] Réponse brute de l'Edge function:", JSON.stringify(data, null, 2));
      
      if (functionCallError) {
        console.error("[UserCreateForm] Erreur d'appel à la fonction Edge:", functionCallError);
        toast.dismiss(toastId);
        toast.error(`Erreur: ${functionCallError.message || "Échec de la création de l'utilisateur"}`);
        return;
      }
      
      if (!data || (data as any).error) {
        const errorMessage = (data as any)?.error || "Erreur lors de la création de l'utilisateur";
        const errorDetails = (data as any)?.details || "";
        console.error("[UserCreateForm] Erreur retournée par l'Edge function:", errorMessage, errorDetails);
        toast.dismiss(toastId);
        
        if (errorMessage.includes("L'utilisateur existe déjà")) {
          toast.error(`Cet email est déjà utilisé par un autre utilisateur. ${errorDetails}`);
        } else {
          toast.error(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`);
        }
        return;
      }
      
      console.log("[UserCreateForm] Utilisateur créé avec succès:", data);
      toast.dismiss(toastId);
      toast.success("Utilisateur créé avec succès");
      form.reset();
      onUserCreated();
    } catch (error: any) {
      toast.dismiss();
      console.error("[UserCreateForm] Erreur non gérée:", error);
      
      let errorMessage = error.message || "Erreur lors de la création de l'utilisateur";
      
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }
      
      if (error.status) {
        errorMessage += ` (Status: ${error.status})`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    onSubmit
  };
};
