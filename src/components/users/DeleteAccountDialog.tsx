import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DeleteAccountDialogProps {
  userEmail: string;
  onDeleted: () => void;
}

const DeleteAccountDialog = ({ userEmail, onDeleted }: DeleteAccountDialogProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    if (confirmEmail !== userEmail) {
      toast.error("L'adresse email ne correspond pas");
      return;
    }

    setIsDeleting(true);

    try {
      // Appeler la edge function pour supprimer le compte
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: (await supabase.auth.getUser()).data.user?.id }
      });

      if (error) throw error;

      toast.success("Votre compte a été supprimé avec succès");
      
      // Déconnecter l'utilisateur et rediriger
      await supabase.auth.signOut();
      onDeleted();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Erreur lors de la suppression du compte : " + error.message);
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer mon compte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Supprimer définitivement votre compte
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm font-medium text-destructive mb-2">
                ⚠️ Cette action est irréversible !
              </p>
              <p className="text-sm text-muted-foreground">
                Toutes vos données seront définitivement supprimées :
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                <li>Profil et informations personnelles</li>
                <li>Toutes vos annonces</li>
                <li>Images et médias téléchargés</li>
                <li>Historique de publications</li>
                <li>Connexions aux réseaux sociaux</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-email">
                Pour confirmer, saisissez votre adresse email :
              </Label>
              <Input
                id="confirm-email"
                type="email"
                placeholder={userEmail}
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || confirmEmail !== userEmail}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? "Suppression en cours..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;
