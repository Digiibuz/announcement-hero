
import React from "react";
import { UserCog } from "lucide-react";
import { UserProfile } from "@/types/auth";
import { useWordPressConfigs } from "@/hooks/useWordPressConfigs";
import { useUserEditForm } from "./userEditForm/useUserEditForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from "./userEditForm/BasicInfoTab";
import WordPressConfigTab from "./userEditForm/WordPressConfigTab";
import FacebookConnectionTab from "./FacebookConnectionTab";
import PublicationLimitsTab from "./userEditForm/PublicationLimitsTab";
import AILimitsTab from "./userEditForm/AILimitsTab";
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
  const { configs } = useWordPressConfigs();

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
  } = useUserEditForm(user, onUserUpdated, onDeleteUser);

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>
            Modifier les informations de {user.name}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
              <TabsTrigger value="basic">Informations</TabsTrigger>
              <TabsTrigger value="wordpress" disabled={role !== "client" && role !== "commercial"}>
                WordPress
              </TabsTrigger>
              <TabsTrigger value="facebook">
                Facebook
              </TabsTrigger>
              <TabsTrigger value="objectives" disabled={role !== "client" && role !== "commercial"}>
                Objectifs
              </TabsTrigger>
              <TabsTrigger value="ai-limits" disabled={role !== "client" && role !== "commercial"}>
                Limites IA
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
              <TabsContent value="basic" className="mt-0">
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
              </TabsContent>
              
              <TabsContent value="wordpress" className="mt-0">
                <WordPressConfigTab 
                  form={form}
                  configs={configs}
                  isLoadingConfigs={isLoadingConfigs}
                  selectedConfigIds={selectedConfigIds}
                  isUpdating={isUpdating}
                  onCancel={() => setIsDialogOpen(false)}
                  onSubmit={handleSubmit}
                  userId={user.id}
                  userRole={user.role}
                />
              </TabsContent>
              
              <TabsContent value="facebook" className="mt-0">
                <FacebookConnectionTab />
              </TabsContent>
              
              <TabsContent value="objectives" className="mt-0">
                <PublicationLimitsTab 
                  user={user}
                  isUpdating={isUpdating}
                  onCancel={() => setIsDialogOpen(false)}
                  onSubmit={handleSubmit}
                  form={form}
                />
              </TabsContent>
              
              <TabsContent value="ai-limits" className="mt-0">
                <AILimitsTab 
                  user={user}
                  isUpdating={isUpdating}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </TabsContent>
            </div>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditForm;
