import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Hash, PenTool, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SocialContentWriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string, hashtags: string[]) => void;
  initialContent?: string;
  initialHashtags?: string[];
}

export default function SocialContentWriterModal({
  isOpen,
  onClose,
  onSave,
  initialContent = "",
  initialHashtags = []
}: SocialContentWriterModalProps) {
  const [content, setContent] = useState(initialContent);
  const [newHashtag, setNewHashtag] = useState("");
  const [hashtags, setHashtags] = useState<string[]>(initialHashtags);

  const handleAddHashtag = () => {
    if (newHashtag.trim() && !hashtags.includes(newHashtag.trim())) {
      const cleanHashtag = newHashtag.trim().startsWith('#') ? newHashtag.trim().slice(1) : newHashtag.trim();
      setHashtags([...hashtags, cleanHashtag]);
      setNewHashtag("");
    }
  };

  const handleRemoveHashtag = (hashtagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== hashtagToRemove));
  };

  const handleSave = () => {
    onSave(content, hashtags);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  const characterCount = content.length;
  const twitterLimit = 280;
  const facebookLimit = 2000;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Rédiger mon post pour les réseaux sociaux
          </DialogTitle>
          <DialogDescription>
            Rédigez votre contenu personnalisé pour les réseaux sociaux. Ajoutez des emojis et des hashtags pour maximiser l'engagement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contenu principal */}
          <div className="space-y-2">
            <Label htmlFor="social-content" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Contenu du post
            </Label>
            <Textarea
              id="social-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Rédigez votre post ici... 

Conseils :
• Utilisez des emojis pour rendre votre contenu plus engageant 🚀
• Posez des questions pour encourager l'interaction
• Incluez un appel à l'action clair
• Mentionnez les avantages pour votre audience"
              className="min-h-[200px] resize-none"
            />
            
            {/* Compteur de caractères */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{characterCount} caractères</span>
              <div className="flex gap-4">
                <span className={`${characterCount > twitterLimit ? 'text-red-500' : 'text-green-600'}`}>
                  Twitter: {characterCount}/{twitterLimit}
                </span>
                <span className={`${characterCount > facebookLimit ? 'text-red-500' : 'text-green-600'}`}>
                  Facebook: {characterCount}/{facebookLimit}
                </span>
              </div>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Hashtags
            </Label>
            
            {/* Input pour ajouter des hashtags */}
            <div className="flex gap-2">
              <Input
                value={newHashtag}
                onChange={(e) => setNewHashtag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddHashtag();
                  }
                }}
                placeholder="Ajouter un hashtag (sans #)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddHashtag}
                disabled={!newHashtag.trim()}
              >
                Ajouter
              </Button>
            </div>

            {/* Liste des hashtags */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((hashtag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => handleRemoveHashtag(hashtag)}
                  >
                    #{hashtag} ×
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Cliquez sur un hashtag pour le supprimer
            </p>
          </div>

          {/* Conseils */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Conseils pour un post engageant</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Commencez par une accroche forte</li>
              <li>• Utilisez des emojis pour attirer l'attention</li>
              <li>• Posez une question pour encourager les commentaires</li>
              <li>• Ajoutez un appel à l'action clair</li>
              <li>• Utilisez 3-5 hashtags pertinents maximum</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            <PenTool className="h-4 w-4 mr-2" />
            Enregistrer le contenu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}