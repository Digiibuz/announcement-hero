
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "@/types/auth";
import PublicationLimitsField from "./PublicationLimitsField";

interface PublicationLimitsTabProps {
  user: UserProfile;
  isUpdating: boolean;
  onCancel: () => void;
  onSubmit: (data: any) => void;
  form: UseFormReturn<any>;
}

const PublicationLimitsTab: React.FC<PublicationLimitsTabProps> = ({
  user,
  isUpdating,
  onCancel,
  onSubmit,
  form
}) => {
  return (
    <ScrollArea className="max-h-[400px] pr-4">
      <div className="space-y-4">
        <PublicationLimitsField 
          user={user} 
          isUpdating={isUpdating}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="button" disabled={isUpdating} onClick={() => onSubmit(form.getValues())}>
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

export default PublicationLimitsTab;
