
import {
  LayoutDashboard,
  BellRing,
  Users,
  LogOut,
  Globe,
  FileEdit,
  Bot,
} from "lucide-react";
import { SidebarGroup } from "./sidebar-group";
import { SidebarMenu } from "./sidebar-menu";
import { SidebarMenuSub } from "./sidebar-menu-sub";
import { UserButton } from "@/components/ui/sidebar/sidebar-user";

// Structure dynamique pour le sidebar en fonction du rôle
export function useSidebarItems({
  isAdmin = false,
  isClient = false,
  onLogout = () => {},
}) {
  // Déterminer le libellé pour la section WordPress en fonction du rôle
  const wordpressLabel = isClient ? "Mon site" : "WordPress";

  return [
    // Groupe principal - visible par tous
    <SidebarGroup key="main">
      <SidebarMenu href="/dashboard" label="Tableau de bord" icon={LayoutDashboard} />
      <SidebarMenu href="/announcements" label="Annonces" icon={BellRing}>
        <SidebarMenuSub href="/announcements">Toutes les annonces</SidebarMenuSub>
        <SidebarMenuSub href="/create">Créer une annonce</SidebarMenuSub>
      </SidebarMenu>
    </SidebarGroup>,

    // Groupe admin - visible uniquement par les admin et clients
    isAdmin || isClient ? (
      <SidebarGroup key="admin" label="Administration">
        {isAdmin && <SidebarMenu href="/users" label="Utilisateurs" icon={Users} />}
        <SidebarMenu href="/wordpress" label={wordpressLabel} icon={Globe} />
        <SidebarMenu href="/tom-e" label="Tom-E" icon={Bot} tooltip="Générateur de contenu" />
      </SidebarGroup>
    ) : null,

    // Groupe utilisateur - visible par tous
    <SidebarGroup key="user">
      <UserButton onLogout={onLogout} />
    </SidebarGroup>,
  ].filter(Boolean); // Filtre les éléments null
}
