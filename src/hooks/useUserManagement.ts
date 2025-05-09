import { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserProfile } from "@/types/auth";

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, wordpress_configs(name, site_url)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const typedUsers: UserProfile[] = data.map(profile => {
          // Check if profile.wordpress_configs exists and has name/site_url properties
          let wordpressConfig = null;
          if (profile.wordpress_configs) {
            // Handle potential SelectQueryError
            const wpConfig = profile.wordpress_configs as any;
            if (wpConfig && typeof wpConfig === 'object' && 'name' in wpConfig && 'site_url' in wpConfig) {
              wordpressConfig = {
                name: String(wpConfig.name),
                site_url: String(wpConfig.site_url)
              };
            }
          }

        return {
          id: typedData<string>(profile.id),
          email: typedData<string>(profile.email),
          name: typedData<string>(profile.name),
          role: typedData<"admin" | "client">(profile.role),
          clientId: typedData<string>(profile.client_id),
          wordpressConfigId: typedData<string>(profile.wordpress_config_id) || null,
          wordpressConfig: wordpressConfig
        };
      });

      setUsers(typedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id: string, userData: Partial<UserProfile>) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Utilisateur mis à jour avec succès");
      await fetchUsers(); // Refresh users after update
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erreur lors de la mise à jour de l'utilisateur");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success("Utilisateur supprimé avec succès");
      await fetchUsers(); // Refresh users after delete
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression de l'utilisateur");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    users,
    isLoading,
    isSubmitting,
    fetchUsers,
    updateUser,
    deleteUser
  };
};
