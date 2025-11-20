
import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserIcon } from "lucide-react";

const ImpersonationBanner = () => {
  const { originalUser, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !originalUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary p-2 text-primary-foreground text-center text-sm z-50 ios-safe-top">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <p>
            Vous êtes connecté en tant que <strong>{originalUser?.name}</strong> (mode administrateur)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={stopImpersonating}
            className="bg-primary-foreground hover:bg-primary-foreground/90 text-primary"
          >
            Revenir à mon compte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
