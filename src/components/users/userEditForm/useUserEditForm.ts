
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserProfile, Role } from "@/types/auth";
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
      role: user.role as Role || "client",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: [],
    },
  });

  useEffect(() => {
    form.reset({
      email: user.email || "",
      name: user.name || "",
      role: user.role as Role || "client",
      clientId: user.clientId || "",
      wordpressConfigId: user.wordpressConfigId || "",
      wpConfigIds: selectedConfigIds,
    });
  }, [user, form, selectedConfigIds]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "role") {
        if (value.role === "admin") {
          form.setValue("wpConfigIds", []);
          form.setValue("wordpressConfigId", "");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmit = async (values: FormSchema) => {
    await onUserUpdated(user.id, {
      email: values.email,
      name: values.name,
      role: values.role as Role,
      wordpressConfigId: values.role === "client" ? values.wordpressConfigId : undefined
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
