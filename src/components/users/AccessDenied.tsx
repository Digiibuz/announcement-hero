
import React from "react";
import { Lock } from "lucide-react";
import AnimatedContainer from "@/components/ui/AnimatedContainer";

const AccessDenied: React.FC = () => {
  return (
    <AnimatedContainer>
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Accès restreint</h2>
          <p className="mt-2 text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    </AnimatedContainer>
  );
};

export default AccessDenied;
