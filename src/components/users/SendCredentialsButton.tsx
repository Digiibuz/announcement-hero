
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserProfile } from "@/types/auth";
import { useSendCredentials } from "@/hooks/useSendCredentials";

interface SendCredentialsButtonProps {
  user: UserProfile;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const SendCredentialsButton: React.FC<SendCredentialsButtonProps> = ({ 
  user, 
  variant = "outline",
  size = "sm"
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const { sendCredentials, isSending } = useSendCredentials();

  const handleSendCredentials = async () => {
    if (!password.trim()) {
      return;
    }

    const success = await sendCredentials(user, password);
    if (success) {
      setIsDialogOpen(false);
      setPassword("");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Mail className="h-4 w-4 mr-1" />
          Envoyer identifiants
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Envoyer les identifiants par email</DialogTitle>
          <DialogDescription>
            Envoyez les identifiants de connexion à <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="col-span-3 bg-gray-50"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Mot de passe
            </Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              className="col-span-3"
            />
          </div>
          
          {user.wordpressConfig && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
              <strong>Informations incluses dans l'email :</strong>
              <br />• Entreprise : {user.wordpressConfig.name}
              <br />• Site web : {user.wordpressConfig.site_url}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSendCredentials}
            disabled={!password.trim() || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendCredentialsButton;
