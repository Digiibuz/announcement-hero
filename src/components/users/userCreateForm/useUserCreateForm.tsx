
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formSchema, FormSchema } from "./UserCreateFormFields";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

export const useUserCreateForm = (onUserCreated: () => void) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { configs } = useWordPressConfigs();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
      role: "client",
      wordpressConfigId: "",
    },
  });

  const onSubmit = async (values: FormSchema) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const toastId = toast.loading("Création de l'utilisateur en cours...");
      
      // Préparer les données à envoyer
      const userData = {
        email: values.email,
        name: values.name,
        password: values.password,
        role: values.role,
        wordpressConfigId: values.role === "client" && values.wordpressConfigId ? values.wordpressConfigId : "",
        
      };
      
      console.log("Données envoyées pour création:", userData);
      
      // Appeler la fonction Edge
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: userData,
      });
      
      if (error) {
        console.error("Erreur lors de l'appel à la fonction:", error);
        setErrorMessage(`Erreur lors de l'appel à la fonction: ${error.message}`);
        toast.dismiss(toastId);
        toast.error(`Erreur: ${error.message || "Échec de la création de l'utilisateur"}`);
        return;
      }

      // Vérifier la réponse de la fonction Edge
      if (!data?.success) {
        console.error("Erreur retournée par la fonction:", data);
        const errorMsg = data?.error || "Erreur inconnue";
        const errorDetails = data?.details || "";
        
        setErrorMessage(`${errorMsg}${errorDetails ? ` - ${errorDetails}` : ""}`);
        toast.dismiss(toastId);
        toast.error(`${errorMsg}${errorDetails ? ` - ${errorDetails}` : ""}`);
        return;
      }
      
      // Succès
      toast.dismiss(toastId);
      toast.success("Utilisateur créé avec succès");
      form.reset();
      setErrorMessage(null);
      onUserCreated();
      setIsDialogOpen(false);
    } catch (apiError: any) {
      console.error("Erreur d'API:", apiError);
      setErrorMessage(`Erreur API: ${apiError.message || "Échec de la connexion à l'API"}`);
      toast.error(`Erreur API: ${apiError.message || "Échec de la connexion à l'API"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isDialogOpen,
    setIsDialogOpen,
    isSubmitting,
    errorMessage,
    configs,
    onSubmit,
  };
};
