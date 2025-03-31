
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GeneratedContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string | null;
  postUrl: string | null;
  error?: string | null;
}

const GeneratedContentDialog: React.FC<GeneratedContentDialogProps> = ({
  isOpen,
  onClose,
  title,
  content,
  postUrl,
  error
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || "Contenu généré"}</DialogTitle>
          <DialogDescription>
            Contenu généré par Tom-E
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-2" />
        
        {error ? (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur de récupération du contenu</AlertTitle>
            <AlertDescription>
              {error}
              <p className="mt-2 text-sm">
                Le contenu a peut-être été généré, mais nous ne pouvons pas l'afficher actuellement. 
                Veuillez vérifier directement sur votre site WordPress.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="flex-1 my-4 overflow-auto rounded-md border p-4">
            {content ? (
              <div 
                className="prose prose-sm md:prose-base max-w-none" 
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Chargement du contenu...
              </div>
            )}
          </ScrollArea>
        )}
        
        <DialogFooter>
          {postUrl && (
            <Button variant="outline" asChild>
              <a href={postUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                Voir sur le site <ExternalLink size={16} />
              </a>
            </Button>
          )}
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedContentDialog;
