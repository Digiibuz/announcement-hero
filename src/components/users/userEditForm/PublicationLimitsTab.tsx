
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PublicationLimitsField 
          user={user} 
          isUpdating={isUpdating}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PublicationLimitsTab;
