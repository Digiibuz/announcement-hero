
import React from "react";
import { Button } from "@/components/ui/button";
import AILimitsField from "./AILimitsField";
import { UserProfile } from "@/types/auth";

interface AILimitsTabProps {
  user: UserProfile;
  isUpdating: boolean;
  onCancel: () => void;
}

const AILimitsTab: React.FC<AILimitsTabProps> = ({
  user,
  isUpdating,
  onCancel
}) => {
  return (
    <div className="space-y-6">
      <AILimitsField user={user} isUpdating={isUpdating} />
      
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Fermer
        </Button>
      </div>
    </div>
  );
};

export default AILimitsTab;
