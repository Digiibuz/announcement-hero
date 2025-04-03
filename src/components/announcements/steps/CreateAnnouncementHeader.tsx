
import React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SaveDraftDialogProps {
  onSaveDraft: () => void;
  onDiscard: () => void;
}

const SaveDraftDialog = ({ onSaveDraft, onDiscard }: SaveDraftDialogProps) => {
  return (
    <SheetContent side="bottom" className="p-6 rounded-t-xl">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Sauvegarder en brouillon ?</h3>
          <p className="text-muted-foreground mt-2">
            Vous pourrez reprendre la création de votre annonce plus tard.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <Button onClick={onSaveDraft} className="w-full">
            Sauvegarder en brouillon
          </Button>
          <Button 
            variant="outline" 
            onClick={onDiscard} 
            className="w-full"
          >
            Quitter sans sauvegarder
          </Button>
        </div>
      </div>
    </SheetContent>
  );
};

interface CreateAnnouncementHeaderProps {
  currentStep: number;
  totalSteps: number;
}

const CreateAnnouncementHeader = ({ 
  currentStep, 
  totalSteps 
}: CreateAnnouncementHeaderProps) => {
  const navigate = useNavigate();
  
  const handleSaveDraft = () => {
    toast({
      title: "Brouillon sauvegardé",
      description: "Vous pourrez reprendre la création de votre annonce plus tard."
    });
    navigate("/announcements");
  };
  
  const handleDiscard = () => {
    // On pourrait éventuellement effacer le localStorage ici
    navigate("/announcements");
  };

  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-medium">Déposer une annonce</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <X className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SaveDraftDialog 
            onSaveDraft={handleSaveDraft} 
            onDiscard={handleDiscard} 
          />
        </Sheet>
      </div>
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-orange-500 transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CreateAnnouncementHeader;
