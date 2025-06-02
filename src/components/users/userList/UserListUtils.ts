
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { UserProfile } from "@/types/auth";

export const UserListUtils = {
  getWordPressConfigName: (user: UserProfile): string => {
    if (user.wordpressConfig) {
      return `${user.wordpressConfig.name} (${user.wordpressConfig.site_url})`;
    }
    return "-";
  },

  getRoleDisplayName: (role: string): string => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'client': return 'Client';
      default: return role;
    }
  },

  getRoleClass: (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-primary/10 text-primary';
      case 'client': return 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400';
      default: return '';
    }
  },

  formatLastLogin: (lastLogin: string | null | undefined): string => {
    if (!lastLogin) return "Jamais";
    try {
      const date = parseISO(lastLogin);
      return format(date, "dd MMM yyyy, HH:mm", { locale: fr });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Format invalide";
    }
  }
};
