
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/auth";
import { FormSchema, formSchema } from "./FormFields";

export const useUserEditForm = (
  user: UserProfile,
  onUserUpdated: (userId: string, userData: Partial<UserProfile>) => Promise<void>,
  onDeleteUser?: (userId: string) => Promise<void>
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [selectedConfigIds, setSelectedConfigIds] = useState<string[]>([]);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: user.email || "",
      name: user.name || "",
      role: user.role || "editor",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: [],
    },
  });

  useEffect(() => {
    const fetchClientConfigurations = async () => {
      if (user.clientId && user.role === "editor") {
        setIsLoadingConfigs(true);
        try {
          const { data, error } = await supabase
            .from('client_wordpress_configs')
            .select('wordpress_config_id')
            .eq('client_id', user.clientId);
          
          if (error) {
            throw error;
          }
          
          const configIds = data.map(item => item.wordpress_config_id);
          setSelectedConfigIds(configIds);
          form.setValue("wpConfigIds", configIds);
        } catch (error) {
          console.error("Error fetching client WordPress configs:", error);
        } finally {
          setIsLoadingConfigs(false);
        }
      }
    };
    
    fetchClientConfigurations();
  }, [user, form]);

  useEffect(() => {
    form.reset({
      email: user.email || "",
      name: user.name || "",
      role: user.role || "editor",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: selectedConfigIds,
    });
  }, [user, form, selectedConfigIds]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "role" && value.role === "admin") {
        form.setValue("wpConfigIds", []);
        form.setValue("wordpressConfigId", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (values: FormSchema) => {
    await onUserUpdated(user.id, {
      email: values.email,
      name: values.name,
      role: values.role,
      clientId: values.role === "editor" ? values.clientId : undefined,
      wordpressConfigId: values.role === "editor" ? values.wordpressConfigId : undefined
    });
    setIsDialogOpen(false);
  };

  const handleDeleteUser = async () => {
    if (onDeleteUser) {
      await onDeleteUser(user.id);
      setConfirmDeleteOpen(false);
      setIsDialogOpen(false);
    }
  };

  return {
    form,
    isDialogOpen,
    setIsDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    isLoadingConfigs,
    selectedConfigIds,
    handleSubmit,
    handleDeleteUser
  };
};
