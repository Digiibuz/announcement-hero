
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserProfile } from "@/types/auth";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";

const userEditSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  role: z.enum(["admin", "client", "editor"]),
  wpConfigIds: z.array(z.string()).optional(),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

export const useUserEditForm = (
  user: UserProfile,
  onUpdate: (userId: string, userData: Partial<UserProfile>) => Promise<void>,
  onDelete?: (userId: string) => Promise<void>
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { configs, isLoading: isLoadingConfigs } = useWordPressConfigs();

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      id: user.id,
      name: user.name || "",
      email: user.email,
      role: user.role,
      wpConfigIds: [],
    },
  });

  // Pour les clients, on utilise directement le wordpressConfigId du profil
  const selectedConfigIds = user.role === "client" && user.wordpressConfigId
    ? [user.wordpressConfigId]
    : [];

  useEffect(() => {
    console.log("useUserEditForm - Setting up wpConfigIds:", {
      userRole: user.role,
      userWordpressConfigId: user.wordpressConfigId,
      selectedConfigIds
    });

    // Pour les clients, on utilise le wordpressConfigId direct du profil
    if (user.role === "client" && user.wordpressConfigId) {
      form.setValue("wpConfigIds", [user.wordpressConfigId]);
    } else {
      form.setValue("wpConfigIds", []);
    }
  }, [user.role, user.wordpressConfigId, form]);

  const handleSubmit = async (data: UserEditFormData) => {
    try {
      await onUpdate(user.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        clientId: user.clientId,
        wordpressConfigId: data.role === "client" ? data.wpConfigIds?.[0] : null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (onDelete) {
      await onDelete(user.id);
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
    handleDeleteUser,
  };
};
