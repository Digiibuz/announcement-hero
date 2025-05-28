
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import PublicationLimitsField from "./PublicationLimitsField";
import { UserProfile } from "@/types/auth";

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
  onCancel
}) => {
  return (
    <div className="space-y-6">
      <PublicationLimitsField user={user} isUpdating={isUpdating} />
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default PublicationLimitsTab;
