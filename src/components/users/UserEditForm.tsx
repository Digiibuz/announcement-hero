
import React from "react";
import { UserCog } from "lucide-react";
import { UserProfile } from "@/types/auth";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useUserEditForm } from "./userEditForm/useUserEditForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from "./userEditForm/BasicInfoTab";
import WordPressConfigTab from "./userEditForm/WordPressConfigTab";
import PublicationLimitsTab from "./userEditForm/PublicationLimitsTab";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserEditFormProps {
  user: UserProfile;
  onUserUpdated: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onResetPassword?: (email: string) => void;
  isUpdating: boolean;
  isDeleting?: boolean;
  isDialogOpen?: boolean;
  setIsDialogOpen?: (open: boolean) => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({
  user,
  onUserUpdated,
  onDeleteUser,
  onResetPassword,
  isUpdating,
  isDeleting = false,
  isDialogOpen: externalIsDialogOpen,
  setIsDialogOpen: externalSetIsDialogOpen
}) => {
  const {
    configs,
    clientConfigs,
    associateClientToConfig,
    removeClientConfigAssociation
  } = useWordPressConfigs();

  const {
    form,
    isDialogOpen: internalIsDialogOpen,
    setIsDialogOpen: internalSetIsDialogOpen,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    isLoadingConfigs,
    selectedConfigIds,
    handleSubmit,
    handleDeleteUser
  } = useUserEditForm(user, async (userId, userData) => {
    await onUserUpdated(userId, userData);
    if (userData.role === "client" && userData.clientId) {
      const newConfigIds = form.getValues("wpConfigIds") || [];
      const associationsToRemove = clientConfigs.filter(cc => cc.client_id === userData.clientId && !newConfigIds.includes(cc.wordpress_config_id));
      for (const assoc of associationsToRemove) {
        await removeClientConfigAssociation(assoc.id);
      }
      for (const configId of newConfigIds) {
        const existingAssoc = clientConfigs.find(cc => cc.client_id === userData.clientId && cc.wordpress_config_id === configId);
        if (!existingAssoc) {
          await associateClientToConfig(userData.clientId, configId);
        }
      }
    }
  }, onDeleteUser);

  // Use external state if provided, otherwise use internal state
  const isDialogOpen = externalIsDialogOpen !== undefined ? externalIsDialogOpen : internalIsDialogOpen;
  const setIsDialogOpen = externalSetIsDialogOpen !== undefined ? externalSetIsDialogOpen : internalSetIsDialogOpen;

  const handleResetPasswordClick = () => {
    if (onResetPassword) {
      onResetPassword(user.email);
    }
  };

  const role = form.watch("role");

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {!externalIsDialogOpen && (
        <DialogTrigger asChild>
          <div className="w-full">
            {/* Trigger content */}
          </div>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifier les informations de {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="basic" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="basic">Informations</TabsTrigger>
              <TabsTrigger value="wordpress" disabled={role !== "client"}>
                WordPress
              </TabsTrigger>
              <TabsTrigger value="limits" disabled={role !== "client"}>
                Limites
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="basic" className="mt-0 h-full">
                <ScrollArea className="h-full pr-4">
                  <BasicInfoTab 
                    form={form}
                    isUpdating={isUpdating}
                    onCancel={() => setIsDialogOpen(false)}
                    onSubmit={handleSubmit}
                    onResetPassword={onResetPassword ? handleResetPasswordClick : undefined}
                    onDeleteUser={onDeleteUser ? handleDeleteUser : undefined}
                    isDeleting={isDeleting}
                    confirmDeleteOpen={confirmDeleteOpen}
                    setConfirmDeleteOpen={setConfirmDeleteOpen}
                  />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="wordpress" className="mt-0 h-full">
                <ScrollArea className="h-full pr-4">
                  <WordPressConfigTab 
                    form={form}
                    configs={configs}
                    isLoadingConfigs={isLoadingConfigs}
                    selectedConfigIds={selectedConfigIds}
                    isUpdating={isUpdating}
                    onCancel={() => setIsDialogOpen(false)}
                    onSubmit={handleSubmit}
                  />
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="limits" className="mt-0 h-full">
                <ScrollArea className="h-full pr-4">
                  <PublicationLimitsTab 
                    user={user}
                    isUpdating={isUpdating}
                    onCancel={() => setIsDialogOpen(false)}
                    onSubmit={handleSubmit}
                    form={form}
                  />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditForm;
